import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feedback from '@/lib/models/Feedback'

export async function GET() {
  try {
    await connectDB()
    const feedbacks = await Feedback.find()
      .populate('instituteId', 'name location')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
    return NextResponse.json(feedbacks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const feedback = await Feedback.create(data)
    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}
