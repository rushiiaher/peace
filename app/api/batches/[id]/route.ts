import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    const batch = await Batch.findByIdAndUpdate(params.id, data, { new: true })
    return NextResponse.json(batch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    await Batch.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 })
  }
}
