import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function DELETE(req: Request, { params }: { params: { id: string, courseId: string } }) {
  try {
    await connectDB()
    const user = await User.findByIdAndUpdate(
      params.id,
      { $pull: { courses: { courseId: params.courseId } } },
      { new: true }
    )
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove course' }, { status: 500 })
  }
}
