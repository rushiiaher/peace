import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    await connectDB()
    const { studentId } = await req.json()

    const exam = await Exam.findById(id)
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const assignment = exam.systemAssignments.find((a: any) => a.studentId.toString() === studentId)
    if (!assignment) return NextResponse.json({ error: 'Student not assigned' }, { status: 404 })

    assignment.attended = true
    await exam.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to mark attendance' }, { status: 500 })
  }
}
