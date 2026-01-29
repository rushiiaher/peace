import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Exam from '@/lib/models/Exam'
import '@/lib/models/Course'
import '@/lib/models/Institute'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const student = await User.findById(params.id).populate('courses.courseId')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const now = new Date()
    // const activeCourses = student.courses.filter((c: any) => {
    //   if (!c.accessExpiresAt) return true
    //   return new Date(c.accessExpiresAt) > now
    // })
    const activeCourses = student.courses || []

    const courseIds = activeCourses.map((c: any) => c.courseId?._id || c.courseId).filter((id: any) => id)

    // Fetch all exams for these courses
    // Fetch all exams for these courses
    const exams = await Exam.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'name code')
      .populate('instituteId', 'name')
      .sort({ date: -1 })
      .lean() // Use lean() to allow modification

    // Auto-update status to Completed for expired exams
    const updates = []

    for (const exam of exams) {
      if (exam.status !== 'Completed' && exam.date) {
        const examDate = new Date(exam.date)
        const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number)
        examDate.setHours(hours, minutes)

        // Add duration + buffer (e.g. 1 hour buffer)
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

    return NextResponse.json(exams)
  } catch (error: any) {
    console.error('Fetch student exams error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch exams' }, { status: 500 })
  }
}
