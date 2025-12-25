import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { courseAssignmentId, institutePrice, discount } = await req.json()

    const institute = await Institute.findById(params.id).populate('courses.courseId')
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    const courseAssignment = institute.courses.find((c: any) => c._id.toString() === courseAssignmentId)
    if (!courseAssignment) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const minPrice = (courseAssignment.courseId.examFee || 0) + (courseAssignment.courseId.certificateCharge || 0)
    const finalPrice = institutePrice * (1 - discount / 100)

    if (finalPrice < minPrice) {
      return NextResponse.json({ error: 'Final price must cover royalty (Exam + Certificate charges)' }, { status: 400 })
    }

    courseAssignment.institutePrice = institutePrice
    courseAssignment.discount = discount

    await institute.save()
    return NextResponse.json(institute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
  }
}
