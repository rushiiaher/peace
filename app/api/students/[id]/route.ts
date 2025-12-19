import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const student = await User.findById(params.id).select('-password')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    delete data.password
    const student = await User.findByIdAndUpdate(params.id, data, { new: true }).select('-password')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status: 500 })
  }
}
