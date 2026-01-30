import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'


export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const data = await req.json()
    const batch = await Batch.findByIdAndUpdate(params.id, data, { new: true })
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    return NextResponse.json(batch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
  }
}

import User from '@/lib/models/User'

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()

    // Find batch to get enrolled students
    const batch = await Batch.findById(params.id)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    // Deallocate course from enrolled students
    if (batch.students && batch.students.length > 0) {
      await User.updateMany(
        { _id: { $in: batch.students } },
        { $pull: { courses: { courseId: batch.courseId } } }
      )
    }

    await Batch.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 })
  }
}
