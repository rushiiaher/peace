import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeedbackForm from '@/lib/models/FeedbackForm'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const form = await FeedbackForm.findById(id).populate(['instituteId', 'courseId'])
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    return NextResponse.json(form)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const data = await req.json()
    const form = await FeedbackForm.findByIdAndUpdate(id, data, { new: true })
      .populate(['instituteId', 'courseId'])
    return NextResponse.json(form)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    // Cascading delete for responses
    const FeedbackResponse = (await import('@/lib/models/FeedbackResponse')).default
    await FeedbackResponse.deleteMany({ formId: id })

    await FeedbackForm.findByIdAndDelete(id)
    return NextResponse.json({ message: 'Form deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
