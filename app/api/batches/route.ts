import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const courseId = searchParams.get('courseId')

    const query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (courseId) query.courseId = courseId

    const limit = parseInt(searchParams.get('limit') || '50')

    const batches = await Batch.find(query)
      .populate('courseId')
      .populate('students')
      .sort({ createdAt: -1 })
      .limit(limit)
    return NextResponse.json(batches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

import Institute from '@/lib/models/Institute'

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    // 1. Create Batch
    const batch = await Batch.create(data)

    // 2. Update Institute's Course Assignment
    // 2. Update Institute's Course Assignment (only if not already assigned)
    const institute = await Institute.findById(data.instituteId)
    if (institute) {
      const isAlreadyAssigned = institute.courses.some((c: any) => c.courseId.toString() === data.courseId)

      if (!isAlreadyAssigned) {
        await Institute.findByIdAndUpdate(data.instituteId, {
          $push: {
            courses: {
              courseId: data.courseId,
              startDate: data.startDate,
              endDate: data.endDate,
              institutePrice: data.institutePrice,
              enrollmentActive: true
            }
          }
        })
      }
    }

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error('Create Batch Error:', error)
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}
