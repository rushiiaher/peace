import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeedbackForm from '@/lib/models/FeedbackForm'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    // Explicitly import for population registration
    await import('@/lib/models/Institute')
    await import('@/lib/models/Course')

    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')

    // For Super Admin view, we typically want to see all forms by default
    const query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (courseId) query.courseId = courseId
    if (status) query.status = status

    const forms = await FeedbackForm.find(query)
      .populate('instituteId', 'name')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })

    return NextResponse.json(forms)
  } catch (error: any) {
    console.error('Error fetching feedback forms:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch forms' }, { status: 500 })
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
