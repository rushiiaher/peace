import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'

import Course from '@/lib/models/Course'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const excludeWithDPP = searchParams.get('excludeWithDPP')
    const search = searchParams.get('search')

    let query: any = {}

    if (courseId) query.courseId = courseId

    if (excludeWithDPP === 'true') {
      query.$or = [{ hasDPP: false }, { hasDPP: { $exists: false } }]
    }

    // Search Logic
    if (search) {
      const searchRegex = new RegExp(search, 'i') // Case-insensitive regex

      // Find courses matching the search name first
      const matchedCourses = await Course.find({ name: searchRegex }).select('_id')
      const matchedCourseIds = matchedCourses.map(c => c._id)

      // Query: QB Topic matches OR Course ID matches one of the found courses
      query.$or = [
        { topic: searchRegex },
        { courseId: { $in: matchedCourseIds } }
      ]
    }

    const limit = parseInt(searchParams.get('limit') || '50')

    const qbs = await QuestionBank.find(query)
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json(qbs)
  } catch (error) {
    console.error("QB Fetch Error:", error)
    return NextResponse.json({ error: 'Failed to fetch question banks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const qb = await QuestionBank.create(data)
    return NextResponse.json(qb, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create question bank' }, { status: 500 })
  }
}
