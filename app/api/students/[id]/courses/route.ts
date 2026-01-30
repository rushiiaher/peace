import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

import '@/lib/models/Course'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
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
