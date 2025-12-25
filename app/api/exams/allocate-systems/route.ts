import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import Institute from '@/lib/models/Institute'
import User from '@/lib/models/User'
import AdmitCard from '@/lib/models/AdmitCard'
import Course from '@/lib/models/Course'
import QuestionBank from '@/lib/models/QuestionBank'

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

    const { openingTime = '09:00', closingTime = '18:00', sectionDuration = 180, breakBetweenSections = 30, workingDays = [1, 2, 3, 4, 5, 6] } = institute.examTimings || {}

    const students = await User.find({ instituteId, role: 'student', 'courses.courseId': courseId })
    const availableSystems = institute.systems?.filter((s: any) => s.status === 'Available') || []

    if (availableSystems.length === 0) return NextResponse.json({ error: 'No systems available' }, { status: 400 })

    let examDate = new Date(date)
    let currentStartTime = startTime || openingTime

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
      const sectionEndTime = addMinutes(currentStartTime, sectionDuration)

      if (parseTime(sectionEndTime) > parseTime(closingTime)) {
        examDate = getNextWorkingDay(examDate, workingDays)
        currentStartTime = openingTime
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
        endTime: addMinutes(currentStartTime, sectionDuration),
        systemAssignments
      })

      currentStartTime = addMinutes(currentStartTime, sectionDuration + breakBetweenSections)
      if (parseTime(currentStartTime) + sectionDuration > parseTime(closingTime)) {
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

    const exam = await Exam.create({
      courseId,
      instituteId,
      type: 'Final',
      title,
      date: sections[0].date,
      startTime: sections[0].startTime,
      endTime: sections[sections.length - 1].endTime,
      duration: sectionDuration,
      totalMarks: questionsToSelect * 2,
      questions: questionPool,
      multiSection: sections.length > 1,
      sections,
      systemAssignments: sections.flatMap(s => s.systemAssignments),
      status: 'Scheduled'
    })

    const course = await Course.findById(courseId)
    for (const section of sections) {
      for (let i = 0; i < section.systemAssignments.length; i++) {
        const assignment = section.systemAssignments[i]
        await AdmitCard.create({
          examId: exam._id,
          studentId: assignment.studentId,
          rollNo: students.find(s => s._id.equals(assignment.studentId))?.rollNo,
          studentName: students.find(s => s._id.equals(assignment.studentId))?.name,
          courseName: course?.name || 'Course',
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
