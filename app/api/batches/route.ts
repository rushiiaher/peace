import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'

export async function GET() {
  try {
    await connectDB()
    const batches = await Batch.find().populate('courseId').populate('instituteId').populate('students').sort({ createdAt: -1 })
    return NextResponse.json(batches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const batch = await Batch.create(data)
    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}
