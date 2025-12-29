import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const user = await User.findById(params.id).select('-password').populate('courses.courseId')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()

    // Check for duplicate email if email is being updated
    if (data.email) {
      const existingUser = await User.findOne({ email: data.email, _id: { $ne: params.id } }).select('_id').lean()
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists used by another account.' }, { status: 400 })
      }
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    const user = await User.findByIdAndUpdate(params.id, data, { new: true }).select('-password')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const user = await User.findByIdAndDelete(params.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
