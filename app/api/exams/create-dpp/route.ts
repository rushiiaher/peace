import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import QuestionBank from '@/lib/models/QuestionBank'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { courseId, qbSelections } = await req.json()

    if (!qbSelections || !qbSelections[0]) {
      return NextResponse.json({ error: 'Question bank selection required' }, { status: 400 })
    }

    const questionBankId = qbSelections[0].qbId
    const questionCount = qbSelections[0].count
    const customTitle = qbSelections[0].title

    const qb = await QuestionBank.findById(questionBankId)
    if (!qb) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
    if (qb.hasDPP) return NextResponse.json({ error: 'DPP already exists for this Question Bank' }, { status: 400 })

    const selectedQuestions = qb.questions.slice(0, questionCount || qb.questions.length).map((q: any) => ({
      questionId: q._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    }))

    const dppCount = await Exam.countDocuments({ courseId, type: 'DPP' })

    const exam = await Exam.create({
      courseId,
      type: 'DPP',
      title: customTitle || `DPP ${dppCount + 1} - ${qb.topic}`,
      examNumber: dppCount + 1,
      questionBankId,
      date: new Date(),
      duration: 30,
      totalMarks: selectedQuestions.length * 2,
      questions: selectedQuestions,
      status: 'Active'
    })

    await QuestionBank.findByIdAndUpdate(questionBankId, { hasDPP: true })

    return NextResponse.json(exam, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create DPP' }, { status: 500 })
  }
}
