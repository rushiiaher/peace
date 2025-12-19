import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import '@/lib/models/Course' // Ensure Course model is registered

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const role = searchParams.get('role')

    const query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (role) query.role = role

    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
    await User.populate(users, { path: 'courses.courseId' })
    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = await User.create({ ...data, password: hashedPassword })
    const { password, ...userWithoutPassword } = user.toObject()
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}
