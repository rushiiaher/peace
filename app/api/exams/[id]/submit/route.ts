import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import ExamResult from '@/lib/models/ExamResult'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { studentId, answers, timeTaken } = await req.json()

    const exam = await Exam.findById(params.id)
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    let score = 0
    exam.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctAnswer) score += 2
    })

    const percentage = (score / exam.totalMarks) * 100

    const existingResult = await ExamResult.findOne({ examId: params.id, studentId })

    if (existingResult) {
      existingResult.answers = answers
      existingResult.score = score
      existingResult.percentage = percentage
      existingResult.timeTaken = timeTaken
      existingResult.submittedAt = new Date()
      await existingResult.save()
      return NextResponse.json(existingResult)
    }

    const result = await ExamResult.create({
      examId: params.id,
      studentId,
      answers,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      timeTaken
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit exam' }, { status: 500 })
  }
}
