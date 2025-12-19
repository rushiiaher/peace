import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const qbs = await QuestionBank.find({ courseId: params.id }).populate('courseId', 'name code')
    return NextResponse.json(qbs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch question banks' }, { status: 500 })
  }
}
