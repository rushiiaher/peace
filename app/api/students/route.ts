import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Validate userId format
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
      }

      const student = await User.findById(userId)
        .select('-password')
        .populate('instituteId', 'name code')
        .populate('courses.courseId', 'name code')
        .lean() as any

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      // Ensure status field exists
      if (!student.status) {
        student.status = 'Active' // Default to Active if not set
      }

      return NextResponse.json(student)
    }

    const limit = parseInt(searchParams.get('limit') || '100')

    const students = await User.find({ role: 'student' })
      .select('-password')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(students)
  } catch (error: any) {
    console.error('Students API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 })
  }
}
