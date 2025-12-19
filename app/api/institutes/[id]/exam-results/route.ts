import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamResult from '@/lib/models/ExamResult'
import User from '@/lib/models/User'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    
    const students = await User.find({ instituteId: params.id, role: 'student' })
    const studentIds = students.map(s => s._id)
    
    let query: any = { studentId: { $in: studentIds } }
    
    const results = await ExamResult.find(query)
      .populate('studentId', 'name rollNo')
      .populate({ path: 'examId', populate: { path: 'courseId', select: 'name code' } })
      .sort({ submittedAt: -1 })
    
    const filtered = type ? results.filter((r: any) => r.examId?.type === type) : results
    
    return NextResponse.json(filtered)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 })
  }
}
