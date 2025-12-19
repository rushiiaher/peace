import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Exam from '@/lib/models/Exam'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const student = await User.findById(params.id).populate('courses.courseId')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const now = new Date()
    const activeCourses = student.courses.filter((c: any) => {
      // If no expiry set (legacy), allow access or block? 
      // Plan said "Snapshotted expiry", so new users have it. 
      // For safety, assume active if missing, but strictly check date if present.
      if (!c.accessExpiresAt) return true
      return new Date(c.accessExpiresAt) > now
    })

    const courseIds = activeCourses.map((c: any) => c.courseId?._id || c.courseId).filter(Boolean)
    const exams = await Exam.find({ courseId: { $in: courseIds } }).populate('courseId', 'name code').populate('instituteId', 'name').sort({ date: -1 })
    return NextResponse.json(exams)
  } catch (error: any) {
    console.error('Fetch student exams error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch exams' }, { status: 500 })
  }
}
