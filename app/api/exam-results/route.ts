import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamResult from '@/lib/models/ExamResult'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')
    
    let query: any = {}
    if (examId) query.examId = examId
    if (studentId) query.studentId = studentId
    
    const results = await ExamResult.find(query)
      .populate('examId')
      .populate('studentId', 'name rollNo')
      .sort({ submittedAt: -1 })
    
    if (courseId) {
      const filtered = results.filter((r: any) => r.examId?.courseId?.toString() === courseId)
      return NextResponse.json(filtered)
    }
    
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
