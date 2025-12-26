import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const institute = await Institute.findById(params.id).populate('courses.courseId')
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    return NextResponse.json(institute.courses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { courseId, startDate, endDate } = await req.json()

    // Prevent Duplicate Assignment
    const existing = await Institute.findOne({
      _id: params.id,
      'courses.courseId': courseId
    })

    if (existing) {
      return NextResponse.json({ error: 'This course is already assigned to this institute.' }, { status: 400 })
    }

    const institute = await Institute.findByIdAndUpdate(
      params.id,
      { $push: { courses: { courseId, startDate, endDate } } },
      { new: true }
    ).populate('courses.courseId')
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    return NextResponse.json(institute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { courseAssignmentId } = await req.json()
    const institute = await Institute.findByIdAndUpdate(
      params.id,
      { $pull: { courses: { _id: courseAssignmentId } } },
      { new: true }
    ).populate('courses.courseId')
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    return NextResponse.json(institute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove course' }, { status: 500 })
  }
}
