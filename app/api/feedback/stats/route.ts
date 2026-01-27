import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feedback from '@/lib/models/Feedback'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const feedbacks = await Feedback.find()
      .populate('instituteId', 'name')
      .populate('courseId', 'name')
    
    const stats = feedbacks.reduce((acc: any, f: any) => {
      const instId = f.instituteId._id.toString()
      if (!acc[instId]) {
        acc[instId] = {
          instituteName: f.instituteId.name,
          totalRatings: 0,
          sumRatings: 0,
          feedbacks: []
        }
      }
      acc[instId].totalRatings++
      acc[instId].sumRatings += f.rating
      acc[instId].feedbacks.push({
        rating: f.rating,
        feedback: f.feedback,
        studentName: f.studentName,
        courseName: f.courseId.name,
        createdAt: f.createdAt
      })
      return acc
    }, {})

    const result = Object.values(stats).map((s: any) => ({
      ...s,
      averageRating: (s.sumRatings / s.totalRatings).toFixed(1)
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feedback stats' }, { status: 500 })
  }
}
