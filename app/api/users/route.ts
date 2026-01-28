import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import '@/lib/models/Institute' // Ensure model is registered for populate
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const role = searchParams.get('role')

    let query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (role) query.role = role

    const users = await User.find(query)
      .select('name email role instituteId status createdAt lastLogin rollNo')
      .populate('instituteId', 'name code')
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    // Hash password
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12)
    }

    const user = await User.create(data)
    const userResponse = await User.findById(user._id)
      .populate('instituteId', 'name code location')
      .select('-password -sessionToken')
      .lean()

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email or Roll Number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}