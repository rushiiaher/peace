import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { courseId, topic, questions, userId, questionBankId } = await req.json()
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
    }
    
    const formattedQuestions = questions.map((q: any) => ({
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      correctAnswer: q.correctIndex,
      explanation: `Answer: ${q.answerText}`
    }))
    
    if (questionBankId) {
      const qb = await QuestionBank.findByIdAndUpdate(
        questionBankId,
        { $push: { questions: { $each: formattedQuestions } } },
        { new: true }
      )
      return NextResponse.json({
        success: true,
        message: `${formattedQuestions.length} questions added`,
        inserted: formattedQuestions.length
      })
    }
    
    if (!courseId || !topic) {
      return NextResponse.json({ error: 'Missing courseId or topic' }, { status: 400 })
    }
    
    const questionBank = await QuestionBank.create({
      courseId,
      topic,
      questions: formattedQuestions,
      hasDPP: false,
      createdBy: userId,
      importedFrom: 'excel',
      importedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      message: `Question Bank created with ${formattedQuestions.length} questions`,
      questionBankId: questionBank._id,
      inserted: formattedQuestions.length
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message || 'Failed to import questions' }, { status: 500 })
  }
}
