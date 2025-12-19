import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeedbackForm from '@/lib/models/FeedbackForm'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const courseId = searchParams.get('courseId')
    
    const query: any = { status: 'Active' }
    if (instituteId) query.instituteId = instituteId
    if (courseId) query.courseId = courseId
    
    const forms = await FeedbackForm.find(query)
      .populate('instituteId', 'name')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(forms)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const form = await FeedbackForm.create(data)
    await form.populate(['instituteId', 'courseId'])
    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
