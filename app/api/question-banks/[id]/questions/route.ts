import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import QuestionBank from '@/lib/models/QuestionBank'

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const question = await req.json()
    const qb = await QuestionBank.findByIdAndUpdate(
      params.id,
      { $push: { questions: question } },
      { new: true }
    )
    if (!qb) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
    return NextResponse.json(qb)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const { questionId } = await req.json()
    const qb = await QuestionBank.findByIdAndUpdate(
      params.id,
      { $pull: { questions: { _id: questionId } } },
      { new: true }
    )
    if (!qb) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
    return NextResponse.json(qb)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const { questionId, question, options, correctAnswer, explanation } = await req.json()
    const qb = await QuestionBank.findOneAndUpdate(
      { _id: params.id, 'questions._id': questionId },
      {
        $set: {
          'questions.$.question': question,
          'questions.$.options': options,
          'questions.$.correctAnswer': correctAnswer,
          'questions.$.explanation': explanation
        }
      },
      { new: true }
    )
    if (!qb) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    return NextResponse.json(qb)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}
