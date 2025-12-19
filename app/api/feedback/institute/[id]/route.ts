import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feedback from '@/lib/models/Feedback'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const feedbacks = await Feedback.find({ instituteId: params.id })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
    
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0

    return NextResponse.json({
      averageRating: avgRating.toFixed(1),
      totalFeedbacks: feedbacks.length,
      ratings: feedbacks.map(f => ({ rating: f.rating, course: f.courseId, createdAt: f.createdAt }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch institute ratings' }, { status: 500 })
  }
}
