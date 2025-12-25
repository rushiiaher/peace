import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'
import '@/lib/models/Course'
import '@/lib/models/Institute'
import '@/lib/models/User'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const courseId = searchParams.get('courseId')

    let query: any = {}
    if (type) query.type = type
    if (courseId) query.courseId = courseId

    const exams = await Exam.find(query)
      .populate('courseId', 'name code')
      .populate('instituteId', 'name')
      .sort({ date: -1 })
      .lean()

    const User = (await import('@/lib/models/User')).default

    for (const exam of exams) {
      // 1. Populate top-level systemAssignments
      if (exam.systemAssignments?.length > 0) {
        for (let i = 0; i < exam.systemAssignments.length; i++) {
          const studentId = exam.systemAssignments[i].studentId
          if (studentId && !studentId.name) {
            const student = await User.findById(studentId).select('name rollNo').lean()
            if (student) exam.systemAssignments[i].studentId = student
          }
        }

        // Rescheduled Logic (Only relevant if systemAssignments exists)
        const hasRescheduled = exam.systemAssignments.some((sa: any) => sa.isRescheduled)
        if (hasRescheduled) {
          const rescheduledAdmitCards = await AdmitCard.find({
            examId: exam._id,
            isRescheduled: true
          }).sort({ examDate: -1 }).lean()

          if (rescheduledAdmitCards.length > 0) {
            const latestReschedule = rescheduledAdmitCards[0]
            exam.rescheduledDate = latestReschedule.examDate
            exam.rescheduledStartTime = latestReschedule.startTime
            exam.rescheduledEndTime = latestReschedule.endTime
          }
        }
      }

      // 2. Populate sections systemAssignments
      if (exam.sections?.length > 0) {
        for (const section of exam.sections) {
          if (section.systemAssignments?.length > 0) {
            for (let i = 0; i < section.systemAssignments.length; i++) {
              const studentId = section.systemAssignments[i].studentId
              if (studentId && !studentId.name) {
                const student = await User.findById(studentId).select('name rollNo').lean()
                if (student) section.systemAssignments[i].studentId = student
              }
            }
          }
        }
      }
    }

    return NextResponse.json(exams)
  } catch (error: any) {
    console.error('Exam fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const exam = await Exam.create(data)
    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
