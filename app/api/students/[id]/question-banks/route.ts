import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import QuestionBank from '@/lib/models/QuestionBank'
import '@/lib/models/Course'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const student = await User.findById(params.id).populate('courses.courseId')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const now = new Date()
    // const activeCourses = student.courses.filter((c: any) => {
    //   // If no expiry set (legacy), allow access or block? 
    //   // Plan said "Snapshotted expiry", so new users have it. 
    //   // For safety, if missing, assume active OR block. Let's assume active but ideally should be set.
    //   if (!c.accessExpiresAt) return true
    //   return new Date(c.accessExpiresAt) > now
    // })
    const activeCourses = student.courses || []

    const courseIds = activeCourses.map((c: any) => c.courseId?._id).filter((id: any) => id)
    const qbs = await QuestionBank.find({ courseId: { $in: courseIds } }).populate('courseId', 'name code')
    return NextResponse.json(qbs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch question banks' }, { status: 500 })
  }
}
