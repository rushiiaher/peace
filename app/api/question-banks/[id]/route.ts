import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'
import '@/lib/models/Course'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const qb = await QuestionBank.findById(params.id).populate('courseId', 'name code')
    if (!qb) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
    return NextResponse.json(qb)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch question bank' }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const qb = await QuestionBank.findByIdAndDelete(params.id)
    if (!qb) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
    return NextResponse.json({ message: 'Question bank deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question bank' }, { status: 500 })
  }
}
