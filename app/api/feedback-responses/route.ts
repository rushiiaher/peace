import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeedbackResponse from '@/lib/models/FeedbackResponse'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const formId = searchParams.get('formId')
    const studentId = searchParams.get('studentId')
    
    const query: any = {}
    if (formId) query.formId = formId
    if (studentId) query.studentId = studentId
    
    const responses = await FeedbackResponse.find(query)
      .populate('formId')
      .populate('studentId', 'name email rollNo')
      .populate('instituteId', 'name')
      .populate('courseId', 'name')
      .sort({ submittedAt: -1 })
    
    return NextResponse.json(responses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const response = await FeedbackResponse.create(data)
    await response.populate(['formId', 'studentId', 'instituteId', 'courseId'])
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}
