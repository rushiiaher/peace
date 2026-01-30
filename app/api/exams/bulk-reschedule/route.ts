import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import Institute from '@/lib/models/Institute'
import User from '@/lib/models/User'
import AdmitCard from '@/lib/models/AdmitCard'
import Course from '@/lib/models/Course'
import Batch from '@/lib/models/Batch'

export const dynamic = 'force-dynamic'

function parseTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function addMinutes(time: string, mins: number) {
  const total = parseTime(time) + mins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isWeekend(date: Date, workingDays: number[]) {
  return !workingDays.includes(date.getDay())
}

function getNextWorkingDay(date: Date, workingDays: number[]) {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  while (isWeekend(next, workingDays)) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const { examId, studentIds, rescheduleDate, reason } = await req.json()

    const exam = await Exam.findById(examId).populate('instituteId courseId')
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const institute = await Institute.findById(exam.instituteId)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    // Fetch course for exam configuration
    const course = await Course.findById(exam.courseId)
    const targetExamNum = exam.examNumber || 1;
    const examConfig = course?.examConfigurations?.find((c: any) => Number(c.examNumber) === Number(targetExamNum)) || course?.examConfigurations?.[0];
    const courseExamDuration = examConfig?.duration || null

    const { openingTime = '09:00', closingTime = '18:00', sectionDuration = courseExamDuration || institute.examTimings?.sectionDuration || 60, breakBetweenSections = 30, workingDays = [1, 2, 3, 4, 5, 6] } = institute.examTimings || {}

    let examDate = new Date(rescheduleDate)
    if (isWeekend(examDate, workingDays)) {
      examDate = getNextWorkingDay(examDate, workingDays)
    }

    // Accept both 'Available' and 'Active' status systems
    const availableSystems = institute.systems?.filter((s: any) => s.status === 'Available' || s.status === 'Active') || []
    if (availableSystems.length === 0) return NextResponse.json({ error: 'No systems available' }, { status: 400 })

    // Get all existing exams on the same date to check conflicts
    const existingExams = await Exam.find({
      instituteId: exam.instituteId,
      date: examDate,
      _id: { $ne: examId }
    })

    // Also get existing rescheduled admit cards for the same date
    const existingAdmitCards = await AdmitCard.find({
      examDate: examDate,
      isRescheduled: true
    })

    let currentStartTime = openingTime
    const occupiedSlots = new Map()

    // Mark slots occupied by existing exams
    existingExams.forEach((e: any) => {
      e.systemAssignments?.forEach((a: any) => {
        const startTime = e.startTime
        const endTime = addMinutes(startTime, e.duration || sectionDuration)

        // Mark all time slots for this system as occupied
        let slotTime = startTime
        while (parseTime(slotTime) < parseTime(endTime)) {
          const key = `${a.systemName}-${slotTime}`
          occupiedSlots.set(key, true)
          slotTime = addMinutes(slotTime, 20) // 20 min intervals
        }
      })
    })

    // Mark slots occupied by rescheduled students
    existingAdmitCards.forEach((card: any) => {
      const startTime = card.startTime
      const endTime = card.endTime

      let slotTime = startTime
      while (parseTime(slotTime) < parseTime(endTime)) {
        const key = `${card.systemName}-${slotTime}`
        occupiedSlots.set(key, true)
        slotTime = addMinutes(slotTime, 20)
      }
    })

    const rescheduledStudents = []
    let systemIndex = 0

    for (const studentId of studentIds) {
      let assigned = false
      let attempts = 0
      const maxAttempts = 100

      while (!assigned && attempts < maxAttempts) {
        attempts++

        if (systemIndex >= availableSystems.length) {
          // Move to next time slot (20 minutes later)
          currentStartTime = addMinutes(currentStartTime, 20)

          // Check if we can fit a full exam before closing time
          if (parseTime(currentStartTime) + sectionDuration > parseTime(closingTime)) {
            examDate = getNextWorkingDay(examDate, workingDays)
            currentStartTime = openingTime

            // Clear occupied slots for new date
            occupiedSlots.clear()

            // Reload conflicts for new date
            const newDateExams = await Exam.find({
              instituteId: exam.instituteId,
              date: examDate,
              _id: { $ne: examId }
            })

            const newDateAdmitCards = await AdmitCard.find({
              examDate: examDate,
              isRescheduled: true
            })

            // Rebuild occupied slots for new date
            newDateExams.forEach((e: any) => {
              e.systemAssignments?.forEach((a: any) => {
                const startTime = e.startTime
                const endTime = addMinutes(startTime, e.duration || sectionDuration)

                let slotTime = startTime
                while (parseTime(slotTime) < parseTime(endTime)) {
                  const key = `${a.systemName}-${slotTime}`
                  occupiedSlots.set(key, true)
                  slotTime = addMinutes(slotTime, 20)
                }
              })
            })

            newDateAdmitCards.forEach((card: any) => {
              const startTime = card.startTime
              const endTime = card.endTime

              let slotTime = startTime
              while (parseTime(slotTime) < parseTime(endTime)) {
                const key = `${card.systemName}-${slotTime}`
                occupiedSlots.set(key, true)
                slotTime = addMinutes(slotTime, 20)
              }
            })
          }
          systemIndex = 0
        }

        const system = availableSystems[systemIndex]
        const key = `${system.name}-${currentStartTime}`

        // Check if system is free for the entire exam duration
        const examEndTime = addMinutes(currentStartTime, sectionDuration)
        let systemFree = true

        // Check every 20-minute slot during exam duration
        let checkTime = currentStartTime
        while (parseTime(checkTime) < parseTime(examEndTime) && systemFree) {
          const checkKey = `${system.name}-${checkTime}`
          if (occupiedSlots.has(checkKey)) {
            systemFree = false
          }
          checkTime = addMinutes(checkTime, 20)
        }

        // Also ensure we don't exceed institute closing time
        if (parseTime(examEndTime) > parseTime(closingTime)) {
          systemFree = false
        }

        if (systemFree) {
          let assignment = exam.systemAssignments?.find((a: any) => a.studentId.toString() === studentId)
          // Don't modify original exam assignments here - we'll create new exam

          // Mark all slots during exam duration as occupied
          let markTime = currentStartTime
          while (parseTime(markTime) < parseTime(examEndTime)) {
            const markKey = `${system.name}-${markTime}`
            occupiedSlots.set(markKey, true)
            markTime = addMinutes(markTime, 20)
          }

          const student = await User.findById(studentId)
          const course = await Course.findById(exam.courseId)

          const existingAdmitCard = await AdmitCard.findOne({ examId, studentId })

          if (existingAdmitCard) {
            existingAdmitCard.examDate = examDate
            existingAdmitCard.startTime = currentStartTime
            existingAdmitCard.endTime = addMinutes(currentStartTime, sectionDuration)
            existingAdmitCard.systemName = system.name
            existingAdmitCard.isRescheduled = true
            existingAdmitCard.rescheduledReason = reason
            existingAdmitCard.sectionNumber = 999
            await existingAdmitCard.save()
            console.log('Updated admit card:', existingAdmitCard._id, 'with date:', examDate, 'time:', currentStartTime)
          } else {
            // Fetch batch
            const batch = await Batch.findOne({ students: studentId, courseId: exam.courseId, status: 'Active' })
            const batchName = batch ? batch.name : 'Regular Batch'

            const newAdmitCard = await AdmitCard.create({
              examId,
              studentId,
              studentName: student?.name,
              rollNo: student?.rollNo,
              courseName: course?.name,
              batchName: batchName,
              examTitle: exam.title,
              examDate,
              startTime: currentStartTime,
              endTime: addMinutes(currentStartTime, sectionDuration),
              duration: sectionDuration,
              systemName: system.name,
              instituteName: institute.name,
              sectionNumber: 999,
              isRescheduled: true,
              rescheduledReason: reason
            })
            console.log('Created new admit card:', newAdmitCard._id, 'with date:', examDate, 'time:', currentStartTime)
          }

          rescheduledStudents.push({ studentId, systemName: system.name, date: examDate, time: currentStartTime })
          assigned = true

          // Move to next time slot with 20-minute gap
          currentStartTime = addMinutes(currentStartTime, 20)

          // Reset system index to try all systems for next student
          systemIndex = 0
        } else {
          systemIndex++
        }
      }

      if (!assigned) {
        throw new Error(`Failed to assign system for student ${studentId} after ${maxAttempts} attempts`)
      }
    }

    // Create a new exam for rescheduled students
    const rescheduledExam = await Exam.create({
      courseId: exam.courseId,
      instituteId: exam.instituteId,
      type: exam.type,
      title: `${exam.title} (Rescheduled)`,
      examNumber: exam.examNumber || 1,
      date: examDate,
      startTime: openingTime,
      endTime: closingTime,
      duration: sectionDuration,
      totalMarks: exam.totalMarks,
      questions: exam.questions,
      attendanceEnabled: true,
      systemAssignments: rescheduledStudents.map(rs => ({
        studentId: rs.studentId,
        systemName: rs.systemName,
        sectionNumber: 999,
        attended: false,
        isRescheduled: true,
        rescheduledReason: reason
      })),
      status: 'Scheduled'
    })

    // Create new admit cards for rescheduled exam and mark old ones as rescheduled
    for (const rs of rescheduledStudents) {
      const student = await User.findById(rs.studentId)
      const course = await Course.findById(exam.courseId)

      // Fetch batch
      const batch = await Batch.findOne({ students: rs.studentId, courseId: exam.courseId, status: 'Active' })
      const batchName = batch ? batch.name : 'Regular Batch'

      // Create new admit card for rescheduled exam
      await AdmitCard.create({
        examId: rescheduledExam._id,
        examNumber: exam.examNumber || 1,
        studentId: rs.studentId,
        studentName: student?.name,
        rollNo: student?.rollNo,
        courseName: course?.name,
        batchName: batchName,
        examTitle: rescheduledExam.title,
        examDate: rs.date,
        startTime: rs.time,
        endTime: addMinutes(rs.time, sectionDuration),
        duration: sectionDuration,
        systemName: rs.systemName,
        instituteName: institute.name,
        sectionNumber: 999,
        isRescheduled: false
      })

      // Mark original admit card as rescheduled
      await AdmitCard.updateOne(
        { examId: exam._id, studentId: rs.studentId },
        { isRescheduled: true, rescheduledReason: reason }
      )
    }

    // Remove rescheduled students from original exam
    if (exam.systemAssignments) {
      exam.systemAssignments = exam.systemAssignments.filter(
        (assignment: any) => !studentIds.includes(assignment.studentId.toString())
      )
    }

    console.log('Original exam students after removal:', exam.systemAssignments?.length)

    exam.markModified('systemAssignments')
    await exam.save()

    return NextResponse.json({
      message: `${rescheduledStudents.length} students rescheduled successfully`,
      rescheduledStudents,
      originalExamId: exam._id,
      rescheduledExamId: rescheduledExam._id
    })
  } catch (error: any) {
    console.error('Bulk reschedule error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to reschedule',
      stack: error.stack
    }, { status: 500 })
  }
}
