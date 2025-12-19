import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const student = await User.findById(params.id).populate('courses.courseId')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json(student.courses || [])
  } catch (error: any) {
    console.error('Fetch student courses error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch courses' }, { status: 500 })
  }
}
