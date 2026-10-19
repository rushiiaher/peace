import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const batches = await Batch.find({ students: params.id }).populate('courseId')
    // Skip batches whose course was deleted (populate yields null)
    return NextResponse.json(batches.filter((b: any) => b.courseId))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch batches' }, { status: 500 })
  }
}
