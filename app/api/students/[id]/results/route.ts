import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamResult from '@/lib/models/ExamResult'
import '@/lib/models/Exam'
import '@/lib/models/Course'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const results = await ExamResult.find({
      studentId: params.id,
      superseded: { $ne: true } // Only show non-superseded results
    })
      .populate({
        path: 'examId',
        populate: { path: 'courseId', select: 'name code' }
      })
      .sort({ submittedAt: -1 })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Fetch Student Results Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 })
  }
}
