import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'
import '@/lib/models/Course'
import '@/lib/models/Institute'
import '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const courseId = searchParams.get('courseId')
    const instituteId = searchParams.get('instituteId')
    const date = searchParams.get('date')

    let query: any = {}
    if (type) query.type = type
    if (courseId) query.courseId = courseId
    if (instituteId) query.instituteId = instituteId

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.date = { $gte: startOfDay, $lte: endOfDay }
      query.status = { $nin: ['Cancelled', 'Completed'] }
    }

    const exams = await Exam.find(query)
      .select('-questions')
      .populate('courseId', 'name code')
      .populate('instituteId', 'name')
      .sort({ date: -1 })
      .lean()

    const User = (await import('@/lib/models/User')).default

    // Auto-update status to Completed for expired exams
    const now = new Date()
    const updates = []

    for (const exam of exams) {
      if (exam.status !== 'Completed' && exam.date) {
        const examDate = new Date(exam.date)
        const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number)
        examDate.setHours(hours, minutes)

        // Add duration + buffer (e.g. 1 hour buffer)
        // If no duration, assume 1 hour default
        const endTime = new Date(examDate.getTime() + (exam.duration || 60) * 60000 + 60 * 60000)

        if (now > endTime) {
          exam.status = 'Completed'
          updates.push(exam._id)
        }
      }
    }

    if (updates.length > 0) {
      await Exam.updateMany(
        { _id: { $in: updates } },
        { $set: { status: 'Completed' } }
      )
    }

    // Optimized: Collect all student IDs first
    const studentIdsToFetch = new Set<string>()
    for (const exam of exams) {
      exam.systemAssignments?.forEach((sa: any) => {
        if (sa.studentId && typeof sa.studentId === 'string') studentIdsToFetch.add(sa.studentId)
        else if (sa.studentId?._id) studentIdsToFetch.add(sa.studentId._id.toString())
      })
      exam.sections?.forEach((section: any) => {
        section.systemAssignments?.forEach((sa: any) => {
          if (sa.studentId && typeof sa.studentId === 'string') studentIdsToFetch.add(sa.studentId)
          else if (sa.studentId?._id) studentIdsToFetch.add(sa.studentId._id.toString())
        })
      })
    }

    const studentsMap = new Map()
    if (studentIdsToFetch.size > 0) {
      const students = await User.find({ _id: { $in: Array.from(studentIdsToFetch) } }).select('name rollNo').lean()
      students.forEach(s => studentsMap.set(s._id.toString(), s))
    }

    for (const exam of exams) {
      if (exam.systemAssignments?.length > 0) {
        exam.systemAssignments.forEach((sa: any) => {
          const sid = sa.studentId?._id?.toString() || sa.studentId?.toString()
          if (sid && !sa.studentId.name) sa.studentId = studentsMap.get(sid) || sa.studentId
        })

        // Rescheduled Logic
        const hasRescheduled = exam.systemAssignments.some((sa: any) => sa.isRescheduled)
        if (hasRescheduled) {
          const rescheduledAdmitCards = await AdmitCard.find({
            examId: exam._id,
            isRescheduled: true
          }).sort({ examDate: -1 }).limit(1).lean()

          if (rescheduledAdmitCards.length > 0) {
            const latestReschedule = rescheduledAdmitCards[0]
            exam.rescheduledDate = latestReschedule.examDate
            exam.rescheduledStartTime = latestReschedule.startTime
            exam.rescheduledEndTime = latestReschedule.endTime
          }
        }
      }

      if (exam.sections?.length > 0) {
        for (const section of exam.sections) {
          section.systemAssignments?.forEach((sa: any) => {
            const sid = sa.studentId?._id?.toString() || sa.studentId?.toString()
            if (sid && !sa.studentId.name) sa.studentId = studentsMap.get(sid) || sa.studentId
          })
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
