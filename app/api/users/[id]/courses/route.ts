import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { courseId, booksIncluded } = await req.json()

    // 1. Fetch User to get Institute ID
    const user = await User.findById(params.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 2. Fetch Institute to get Course Dates
    const institute = await import('@/lib/models/Institute').then(mod => mod.default.findById(user.instituteId))
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    // 3. Find the specific course assignment
    const courseAssignment = institute.courses.find((c: any) => c.courseId.toString() === courseId)
    if (!courseAssignment) return NextResponse.json({ error: 'Course not assigned to institute' }, { status: 404 })

    // 4. Update User with Snapshot Expiry
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      {
        $addToSet: {
          courses: {
            courseId,
            booksIncluded,
            accessExpiresAt: courseAssignment.endDate // SNAPSHOT!
          }
        }
      },
      { new: true }
    ).populate('courses.courseId')

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Add course error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add course' }, { status: 500 })
  }
}
