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

    // Enforce 2 marks per question for total marks calculation to ensure accuracy
    const calculatedTotalMarks = exam.questions.length * 2
    const percentage = calculatedTotalMarks > 0 ? (score / calculatedTotalMarks) * 100 : 0

    const existingResult = await ExamResult.findOne({ examId: params.id, studentId })

    if (existingResult) {
      existingResult.answers = answers
      existingResult.score = score
      existingResult.percentage = percentage
      existingResult.totalMarks = calculatedTotalMarks // update total marks reference
      existingResult.timeTaken = timeTaken
      existingResult.submittedAt = new Date()
      await existingResult.save()
      return NextResponse.json(existingResult)
    }

    // Check if this is a rescheduled exam (title contains "Rescheduled")
    const isRescheduled = exam.title?.includes('(Rescheduled)')

    const result = await ExamResult.create({
      examId: params.id,
      studentId,
      answers,
      score,
      totalMarks: calculatedTotalMarks, // Use calculated total
      percentage,
      timeTaken
    })

    // If this is a rescheduled exam, mark previous results for this student/course as superseded
    if (isRescheduled) {
      const originalExamTitle = exam.title.replace(' (Rescheduled)', '')

      // Find original exam (without "Rescheduled" suffix, same course)
      const originalExam = await Exam.findOne({
        courseId: exam.courseId,
        instituteId: exam.instituteId,
        title: originalExamTitle,
        type: 'Final'
      })

      if (originalExam) {
        // Mark old result as superseded
        await ExamResult.updateMany(
          {
            studentId,
            examId: originalExam._id,
            superseded: false // Only update if not already superseded
          },
          {
            $set: {
              superseded: true,
              supersededBy: result._id
            }
          }
        )
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit exam' }, { status: 500 })
  }
}
