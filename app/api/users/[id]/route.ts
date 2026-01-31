import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import '@/lib/models/Course'
import '@/lib/models/Institute'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const user = await User.findById(id)
      .populate('instituteId', 'name code location')
      .populate('courses.courseId', 'name code')
      .select('-password')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const data = await req.json()

    // Hash password if provided
    if (data.password && data.password.trim()) {
      data.password = await bcrypt.hash(data.password, 12)
    } else {
      delete data.password
    }

    // Clean data and handle validation
    if (!data.instituteId || data.instituteId === 'undefined' || data.instituteId === '') {
      delete data.instituteId
    }

    // Handle empty rollNo to prevent unique constraint violation (sparse index)
    if (data.rollNo === '' || data.rollNo === null) {
      delete data.rollNo
    }

    const user = await User.findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .populate('courses.courseId', 'name code')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Email or Roll Number'
      return NextResponse.json({ error: `${field} already exists` }, { status: 400 })
    }
    return NextResponse.json({
      error: 'Failed to update user',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}