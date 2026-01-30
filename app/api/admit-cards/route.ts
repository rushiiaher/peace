import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdmitCard from '@/lib/models/AdmitCard'
import Exam from '@/lib/models/Exam'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import '@/lib/models/Institute'


export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    const instituteId = searchParams.get('instituteId')

    let query: any = {}

    if (examId) {
      query.examId = examId
    } else if (studentId) {
      query.studentId = studentId
    } else if (instituteId) {
      // Find exams for this institute
      const exams = await Exam.find({ instituteId }).select('_id')
      const examIds = exams.map(e => e._id)
      query.examId = { $in: examIds }
    } else {
      return NextResponse.json({ error: 'examId, studentId, or instituteId is required' }, { status: 400 })
    }

    const admitCards = await AdmitCard.find(query)
      .populate('studentId', 'name motherName aadhaarCardNo documents')
      .populate({
        path: 'examId',
        select: 'type title examNumber courseId duration endTime startTime',
        populate: {
          path: 'courseId'
        }
      })
      .lean()
    return NextResponse.json(admitCards)
  } catch (error: any) {
    console.error('Admit cards fetch error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to fetch admit cards',
      stack: error.stack
    }, { status: 500 })
  }
}
