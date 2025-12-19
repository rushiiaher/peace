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
    const { courseId, instituteId, title, date, startTime, endTime, duration, totalQuestions, selectedQBIds } = await req.json()

    const examDateTime = new Date(`${date}T${startTime}`)

    const institute = await Institute.findById(instituteId)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    const availableSystems = institute.systems?.filter((s: any) => s.status === 'Available') || []
    if (availableSystems.length === 0) return NextResponse.json({ error: 'No systems available' }, { status: 400 })

    const students = await User.find({
      instituteId,
      role: 'student',
      'courses.courseId': courseId
    })

    if (students.length > availableSystems.length) {
      return NextResponse.json({ error: 'Not enough systems for all students' }, { status: 400 })
    }

    const query = selectedQBIds && selectedQBIds.length > 0
      ? { _id: { $in: selectedQBIds } }
      : { courseId }

    const qbs = await QuestionBank.find(query)
    if (qbs.length === 0) return NextResponse.json({ error: 'No question banks found' }, { status: 400 })

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

    const systemAssignments = students.map((student, i) => ({
      studentId: student._id,
      systemName: availableSystems[i].name,
      attended: false
    }))

    const exam = await Exam.create({
      courseId,
      instituteId,
      type: 'Final',
      title,
      date: examDateTime,
      startTime,
      endTime,
      duration,
      totalMarks: questionsToSelect * 2,
      questions: questionPool,
      systemAssignments,
      status: 'Scheduled'
    })

    const course = await Course.findById(courseId)

    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      await AdmitCard.create({
        examId: exam._id,
        studentId: student._id,
        rollNo: student.rollNo,
        studentName: student.name,
        courseName: course?.name || 'Course',
        examTitle: title,
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
