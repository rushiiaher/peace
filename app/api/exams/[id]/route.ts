import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const exam = await Exam.findById(params.id)
      .populate('courseId', 'name code')
      .populate('instituteId', 'name')
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    return NextResponse.json(exam)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    console.log('PUT /api/exams/[id] - ID:', params.id, 'Data:', data)
    
    const exam = await Exam.findByIdAndUpdate(params.id, data, { new: true })
    if (!exam) {
      console.error('Exam not found:', params.id)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }
    
    console.log('Updated exam:', exam._id, 'attendanceEnabled:', exam.attendanceEnabled)
    return NextResponse.json(exam)
  } catch (error: any) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const exam = await Exam.findById(params.id)
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    
    if (exam.type === 'DPP' && exam.questionBankId) {
      const QuestionBank = (await import('@/lib/models/QuestionBank')).default
      await QuestionBank.findByIdAndUpdate(exam.questionBankId, { hasDPP: false })
    }
    
    await Exam.findByIdAndDelete(params.id)
    
    const AdmitCard = (await import('@/lib/models/AdmitCard')).default
    await AdmitCard.deleteMany({ examId: params.id })
    
    return NextResponse.json({ message: 'Exam deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
