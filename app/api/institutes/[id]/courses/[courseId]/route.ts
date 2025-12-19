import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'

export async function PUT(req: Request, { params }: { params: { id: string, courseId: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    
    const updateFields: any = {}
    if (data.startDate) updateFields['courses.$.startDate'] = new Date(data.startDate)
    if (data.endDate) updateFields['courses.$.endDate'] = new Date(data.endDate)
    if (data.enrollmentActive !== undefined) updateFields['courses.$.enrollmentActive'] = data.enrollmentActive
    
    const result = await Institute.updateOne(
      { _id: params.id, 'courses._id': params.courseId },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Institute or course not found' }, { status: 404 })
    }
    
    const institute = await Institute.findById(params.id).populate('courses.courseId')
    return NextResponse.json(institute)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update course' }, { status: 500 })
  }
}
