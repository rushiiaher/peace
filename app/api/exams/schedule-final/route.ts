import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import QuestionBank from '@/lib/models/QuestionBank'
import Institute from '@/lib/models/Institute'
import User from '@/lib/models/User'
import AdmitCard from '@/lib/models/AdmitCard'
import Course from '@/lib/models/Course'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { courseId, instituteId, title, date, startTime, studentIds, examNumber } = await req.json()

    const examDateTime = new Date(`${date}T${startTime}`)

    const institute = await Institute.findById(instituteId)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    const course = await Course.findById(courseId).populate('examConfigurations.questionBanks')
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const targetExamNumber = examNumber || 1
    const examConfig = course.examConfigurations?.find((c: any) => c.examNumber === targetExamNumber)

    if (!examConfig) return NextResponse.json({ error: `Configuration for Exam ${targetExamNumber} not found in Course` }, { status: 400 })

    const { duration, totalQuestions, questionBanks } = examConfig

    // --- Operational Hours Validation ---
    const getMinutes = (timeStr: string) => {
      if (!timeStr) return 0
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const examStartMins = getMinutes(startTime)
    const examEndMins = examStartMins + duration

    const { examTimings } = institute
    if (examTimings) {
      // 1. Check Working Day
      const dayOfWeek = examDateTime.getDay() // 0 = Sunday
      const workingDays = examTimings.workingDays || [1, 2, 3, 4, 5, 6]
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      if (!workingDays.includes(dayOfWeek)) {
        return NextResponse.json({ error: `Institute is closed on ${days[dayOfWeek]}s` }, { status: 400 })
      }

      // 2. Check Time Bounds
      const openMins = getMinutes(examTimings.openingTime || '09:00')
      const closeMins = getMinutes(examTimings.closingTime || '18:00')

      if (examStartMins < openMins) {
        return NextResponse.json({ error: `Exam cannot start before opening time (${examTimings.openingTime})` }, { status: 400 })
      }
      if (examStartMins >= closeMins) {
        return NextResponse.json({ error: `Exam cannot start after closing time (${examTimings.closingTime})` }, { status: 400 })
      }
      if (examEndMins > closeMins) {
        const endH = Math.floor(examEndMins / 60)
        const endM = examEndMins % 60
        const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
        return NextResponse.json({ error: `Exam ends at ${endStr}, which is after closing time (${examTimings.closingTime})` }, { status: 400 })
      }
    }

    // --- Conflict Detection (System Availability) ---
    const startOfDay = new Date(examDateTime)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(examDateTime)
    endOfDay.setHours(23, 59, 59, 999)

    const existingExams = await Exam.find({
      instituteId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'Completed'] },
      _id: { $ne: null }
    })

    const busySystemNames = new Set<string>()

    existingExams.forEach((ex: any) => {
      const exStart = getMinutes(ex.startTime)
      let exEnd = getMinutes(ex.endTime)
      if (!exEnd || exEnd <= exStart) exEnd = exStart + (ex.duration || 60)

      // Overlap: (StartA < EndB) && (EndA > StartB)
      if (examStartMins < exEnd && examEndMins > exStart) {
        ex.systemAssignments?.forEach((sa: any) => {
          if (sa.systemName) busySystemNames.add(sa.systemName)
        })
      }
    })

    const hardwareAvailable = institute.systems?.filter((s: any) => s.status === 'Available') || []
    // availableSystems is the list of systems that are BOTH physically working AND not booked
    const availableSystems = hardwareAvailable.filter((s: any) => !busySystemNames.has(s.name))

    if (availableSystems.length === 0) {
      return NextResponse.json({ error: 'No systems available (all booked or offline) for this time slot.' }, { status: 400 })
    }

    const selectedQBIds = questionBanks.map((qb: any) => qb._id || qb)

    let students;
    if (studentIds && studentIds.length > 0) {
      students = await User.find({ _id: { $in: studentIds } })
    } else {
      students = await User.find({
        instituteId,
        role: 'student',
        'courses.courseId': courseId
      })
    }

    if (students.length > availableSystems.length) {
      return NextResponse.json({ error: `Not enough systems. Selected: ${students.length}, Available: ${availableSystems.length} (Total Labs: ${hardwareAvailable.length}, Occupied: ${busySystemNames.size})` }, { status: 400 })
    }

    const query = { _id: { $in: selectedQBIds } }
    const qbs = await QuestionBank.find(query)
    if (qbs.length === 0) return NextResponse.json({ error: 'No question banks found for this exam' }, { status: 400 })

    const totalAvailable = qbs.reduce((sum: number, qb: any) => sum + qb.questions.length, 0)
    const questionsToSelect = Math.min(totalQuestions, totalAvailable)

    const questionPool: any[] = []
    let remaining = questionsToSelect

    qbs.forEach((qb: any, index: number) => {
      const proportion = qb.questions.length / totalAvailable
      const count = index === qbs.length - 1 ? remaining : Math.floor(questionsToSelect * proportion)
      const shuffled = [...qb.questions].sort(() => 0.5 - Math.random())
      questionPool.push(...shuffled.slice(0, Math.min(count, qb.questions.length)))
      remaining -= count
    })

    // Calculate End Time for record
    const endDateTime = new Date(examDateTime.getTime() + duration * 60000)
    const endTime = endDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

    const systemAssignments = students.map((student, i) => ({
      studentId: student._id,
      systemName: availableSystems[i].name,
      attended: false
    }))

    const finalTitle = title || `${course.name} - Exam ${targetExamNumber}`

    const exam = await Exam.create({
      courseId,
      instituteId,
      type: 'Final',
      title: finalTitle,
      examNumber: targetExamNumber,
      date: examDateTime,
      startTime,
      endTime,
      duration,
      totalMarks: questionsToSelect * 2,
      questions: questionPool,
      systemAssignments,
      status: 'Scheduled'
    })

    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      await AdmitCard.create({
        examId: exam._id,
        examNumber: targetExamNumber,
        studentId: student._id,
        rollNo: student.rollNo,
        studentName: student.name,
        courseName: course?.name || 'Course',
        examTitle: finalTitle,
        examDate: examDateTime,
        startTime,
        endTime,
        duration,
        systemName: availableSystems[i].name,
        instituteName: institute.name
      })
    }

    return NextResponse.json(exam, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to schedule exam' }, { status: 500 })
  }
}
