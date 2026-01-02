import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamResult from '@/lib/models/ExamResult'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const results = await ExamResult.find({
      studentId: params.id,
      superseded: { $ne: true } // Only show non-superseded results
    })
      .populate({ path: 'examId', populate: { path: 'courseId', select: 'name code' } })
      .sort({ submittedAt: -1 })
    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 })
  }
}
