import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'
import Exam from '@/lib/models/Exam'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { courseId, instituteId, questionCount = 10 } = await req.json()
    
    const qbs = await QuestionBank.find({ courseId })
    let allQuestions: any[] = []
    qbs.forEach(qb => {
      qb.questions.forEach((q: any) => {
        allQuestions.push({
          questionId: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        })
      })
    })
    
    const shuffled = allQuestions.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount, allQuestions.length))
    
    const dppCount = await Exam.countDocuments({ courseId, type: 'DPP' })
    
    const exam = await Exam.create({
      courseId,
      instituteId,
      type: 'DPP',
      title: `DPP ${dppCount + 1}`,
      examNumber: dppCount + 1,
      date: new Date(),
      duration: 30,
      totalMarks: selectedQuestions.length,
      questions: selectedQuestions,
      status: 'Active'
    })
    
    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate DPP' }, { status: 500 })
  }
}
