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
      if (exam.systemAssignments?.length > 0) {
        for (let i = 0; i < exam.systemAssignments.length; i++) {
          const studentId = exam.systemAssignments[i].studentId
          if (studentId) {
            const student = await User.findById(studentId).select('name rollNo').lean()
            if (student) {
              exam.systemAssignments[i].studentId = student
            }
          }
        }

        // Get rescheduled date info for exams with rescheduled students
        const hasRescheduled = exam.systemAssignments.some((sa: any) => sa.isRescheduled)
        if (hasRescheduled) {
          // Get all rescheduled admit cards for this exam
          const rescheduledAdmitCards = await AdmitCard.find({
            examId: exam._id,
            isRescheduled: true
          }).sort({ examDate: -1 }).lean()

          console.log('Rescheduled admit cards for exam', exam.title, ':', rescheduledAdmitCards.length)
          if (rescheduledAdmitCards.length > 0) {
            console.log('First admit card data:', {
              _id: rescheduledAdmitCards[0]._id,
              examDate: rescheduledAdmitCards[0].examDate,
              startTime: rescheduledAdmitCards[0].startTime,
              isRescheduled: rescheduledAdmitCards[0].isRescheduled
            })
          }

          if (rescheduledAdmitCards.length > 0) {
            // Use the most recent rescheduled date
            const latestReschedule = rescheduledAdmitCards[0]
            exam.rescheduledDate = latestReschedule.examDate
            exam.rescheduledStartTime = latestReschedule.startTime
            exam.rescheduledEndTime = latestReschedule.endTime
            console.log('Set rescheduled date:', exam.rescheduledDate, 'from admit card:', latestReschedule._id)
          } else {
            console.log('No rescheduled admit cards found for exam:', exam.title)
          }
        }
      }
    }

    console.log('Final exams:', exams.filter((e: any) => e.type === 'Final').map((e: any) => ({
      title: e.title,
      attendanceEnabled: e.attendanceEnabled,
      hasSystemAssignments: !!e.systemAssignments?.length
    })))

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
