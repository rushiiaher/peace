import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdmitCard from '@/lib/models/AdmitCard'
import Exam from '@/lib/models/Exam'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import Institute from '@/lib/models/Institute'

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
      // Use lean for performance
      const exams = await Exam.find({ instituteId }).select('_id').lean()
      const examIds = exams.map(e => e._id)
      query.examId = { $in: examIds }
    } else {
      return NextResponse.json({ error: 'examId, studentId, or instituteId is required' }, { status: 400 })
    }

    // Explicitly load everything to avoid 500s during population
    const admitCards = await AdmitCard.find(query)
      .populate({
        path: 'studentId',
        select: 'name motherName aadhaarCardNo documents'
      })
      .populate({
        path: 'examId',
        select: 'type title examNumber courseId duration startTime endTime totalMarks',
        populate: {
          path: 'courseId'
        }
      })
      .lean()

    return NextResponse.json(admitCards)
  } catch (error: any) {
    console.error('Admit cards fetch error:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message,
      path: 'admit-cards/GET'
    }, { status: 500 })
  }
}
