import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import '@/lib/models/Institute' // Ensure model is registered for populate
import '@/lib/models/Course'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const role = searchParams.get('role')

    const courseId = searchParams.get('courseId')
    const batchId = searchParams.get('batchId')

    let query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (role) query.role = role
    if (courseId) query['courses.courseId'] = courseId

    // Handle batchId filtering - if batchId is provided, we fetch students from that batch
    if (batchId) {
      const Batch = (await import('@/lib/models/Batch')).default
      const batch = await Batch.findById(batchId)
      if (batch) {
        query._id = { $in: batch.students }
      } else {
        // If batch not found, return empty
        return NextResponse.json([])
      }
    }

    const users = await User.find(query)
      .select('name email role instituteId status createdAt lastLogin rollNo phone documents courses motherName aadhaarCardNo dateOfBirth')
      .populate('instituteId', 'name code')
      .populate('courses.courseId', 'name code')
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

    // Handle empty rollNo to prevent unique constraint violation (sparse index)
    if (data.rollNo === '' || data.rollNo === null) {
      delete data.rollNo
    }

    // Auto-generate roll number if missing for students
    if (data.role === 'student' && !data.rollNo) {
      const Institute = (await import('@/lib/models/Institute')).default
      const inst = await Institute.findById(data.instituteId)
      const instCode = inst?.code || 'ST'
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      data.rollNo = `${instCode}-${timestamp}${random}`
    }

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
      const field = Object.keys(error.keyPattern || {})[0] || 'Email or Roll Number'
      return NextResponse.json({ error: `${field} already exists` }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}