import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (userId) {
      const student = await User.findById(userId).select('-password')
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      return NextResponse.json(student)
    }

    const limit = parseInt(searchParams.get('limit') || '100')

    const students = await User.find({ role: 'student' })
      .select('-password')
      .limit(limit)
      .sort({ createdAt: -1 }) // Good practice to sort when limiting

    return NextResponse.json(students)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 })
  }
}
