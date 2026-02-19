import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import Institute from '@/lib/models/Institute'
import User from '@/lib/models/User'
import AdmitCard from '@/lib/models/AdmitCard'
import Course from '@/lib/models/Course'
import QuestionBank from '@/lib/models/QuestionBank'
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
    const { courseId, instituteId, title, date, startTime, totalQuestions, selectedQBIds, forceNextDay, forceNextSection } = await req.json()

    const institute = await Institute.findById(instituteId)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    const course = await Course.findById(courseId)
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Get exam configuration from course if available
    // Find the appropriate exam configuration (default to first one if exists)
    const examConfig = course.examConfigurations?.[0]
    const courseExamDuration = examConfig?.duration || null

    // Enforce strict operational hours as requested
    // Cooling time reduced to 15 mins
    const openingTime = '08:00'
    const closingTime = '18:30'
    const { sectionDuration = courseExamDuration || 60, workingDays = [1, 2, 3, 4, 5, 6] } = institute.examTimings || {}
    const breakBetweenSections = 15 // Reduced from 30 to 15 minutes

    const students = await User.find({ instituteId, role: 'student', 'courses.courseId': courseId })
    // Accept both 'Available' and 'Active' status systems
    const availableSystems = institute.systems?.filter((s: any) => s.status === 'Available' || s.status === 'Active') || []

    if (availableSystems.length === 0) return NextResponse.json({ error: 'No systems available' }, { status: 400 })

    let examDate = new Date(date)
    let currentStartTime = startTime || openingTime

    // Ensure start time is not before opening time
    if (startTime && parseTime(startTime) < parseTime(openingTime)) {
      currentStartTime = openingTime
    }

    if (forceNextDay) {
      examDate = getNextWorkingDay(examDate, workingDays)
      currentStartTime = openingTime
    } else if (forceNextSection) {
      const nextStart = addMinutes(currentStartTime, sectionDuration + breakBetweenSections)
      if (parseTime(nextStart) + sectionDuration > parseTime(closingTime)) {
        examDate = getNextWorkingDay(examDate, workingDays)
        currentStartTime = openingTime
      } else {
        currentStartTime = nextStart
      }
    }

    const sections: any[] = []
    let remainingStudents = [...students]
    let sectionNumber = 1

    while (remainingStudents.length > 0) {
      const sectionStudents = remainingStudents.splice(0, availableSystems.length)
      let sectionEndTime = addMinutes(currentStartTime, sectionDuration)

      if (parseTime(sectionEndTime) > parseTime(closingTime)) {
        examDate = getNextWorkingDay(examDate, workingDays)
        currentStartTime = openingTime
        // Recalculate end time for the new start time
        sectionEndTime = addMinutes(currentStartTime, sectionDuration)
      }

      const systemAssignments = sectionStudents.map((student, i) => ({
        studentId: student._id,
        systemName: availableSystems[i].name,
        attended: false,
        sectionNumber
      }))

      sections.push({
        sectionNumber,
        date: new Date(examDate),
        startTime: currentStartTime,
        endTime: sectionEndTime,
        systemAssignments
      })

      currentStartTime = addMinutes(currentStartTime, sectionDuration + breakBetweenSections)
      // Check if next section can fit in current day
      if (parseTime(currentStartTime) + sectionDuration > parseTime(closingTime)) {
        // If not, move to next day
        examDate = getNextWorkingDay(examDate, workingDays)
        currentStartTime = openingTime
      }
      sectionNumber++
    }

    const qbs = await QuestionBank.find(selectedQBIds?.length ? { _id: { $in: selectedQBIds } } : { courseId })
    const totalAvailable = qbs.reduce((sum: number, qb: any) => sum + qb.questions.length, 0)
    const questionsToSelect = Math.min(totalQuestions, totalAvailable)

    const questionPool: any[] = []
    let remaining = questionsToSelect
    qbs.forEach((qb: any, i: number) => {
      const proportion = qb.questions.length / totalAvailable
      const count = i === qbs.length - 1 ? remaining : Math.floor(questionsToSelect * proportion)
      const shuffled = [...qb.questions].sort(() => 0.5 - Math.random())
      questionPool.push(...shuffled.slice(0, Math.min(count, qb.questions.length)))
      remaining -= count
    })

    // Determine exam number and total marks based on course configuration
    let examNumber = 1;
    const numMatch = title.match(/Exam\s*(\d+)/i);
    if (numMatch) examNumber = parseInt(numMatch[1]);

    const baseTitle = title.replace(/\(Rescheduled\)/i, '').trim().toLowerCase();
    const evalComp = course.evaluationComponents?.find((c: any) => {
      const compName = c.name.toLowerCase();
      return compName === baseTitle ||
        compName === `exam ${examNumber}` ||
        compName === `final exam ${examNumber}` ||
        (examNumber === 1 && (compName === 'final exam' || compName === 'theory' || compName === 'theory exam')) ||
        compName.includes(baseTitle) ||
        baseTitle.includes(compName);
    });

    const finalTotalMarks = evalComp?.maxMarks || questionsToSelect * 2;

    const exam = await Exam.create({
      courseId,
      instituteId,
      type: 'Final',
      title,
      examNumber,
      date: sections[0].date,
      startTime: sections[0].startTime,
      endTime: sections[sections.length - 1].endTime,
      duration: sectionDuration,
      totalMarks: finalTotalMarks,
      questions: questionPool,
      multiSection: sections.length > 1,
      sections,
      systemAssignments: sections.flatMap(s => s.systemAssignments),
      status: 'Scheduled'
    })

    // course is already fetched at the beginning of the function
    for (const section of sections) {
      for (let i = 0; i < section.systemAssignments.length; i++) {
        const assignment = section.systemAssignments[i]
        const student = students.find(s => s._id.equals(assignment.studentId))

        // Fetch batch name for the student
        const batch = await Batch.findOne({
          students: assignment.studentId,
          courseId: courseId,
          status: 'Active'
        })
        const batchName = batch ? batch.name : 'Regular Batch'

        await AdmitCard.create({
          examId: exam._id,
          studentId: assignment.studentId,
          rollNo: student?.rollNo,
          studentName: student?.name,
          courseName: course?.name || 'Course',
          batchName: batchName,
          examTitle: title,
          examDate: section.date,
          startTime: section.startTime,
          endTime: section.endTime,
          duration: sectionDuration,
          systemName: assignment.systemName,
          instituteName: institute.name,
          sectionNumber: section.sectionNumber
        })
      }
    }

    return NextResponse.json({ exam, sections: sections.length, message: sections.length > 1 ? `Exam scheduled in ${sections.length} sections` : 'Exam scheduled' }, { status: 201 })
  } catch (error: any) {
    console.error('Allocate Systems Error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to allocate systems',
      stack: error.stack
    }, { status: 500 })
  }
}
