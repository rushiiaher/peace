import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { examId, studentId, reason } = await req.json()
    
    const exam = await Exam.findById(examId)
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    
    const assignment = exam.systemAssignments?.find((a: any) => a.studentId.toString() === studentId)
    if (!assignment) return NextResponse.json({ error: 'Student not assigned' }, { status: 404 })
    
    assignment.isRescheduled = true
    assignment.rescheduledReason = reason
    exam.markModified('systemAssignments')
    await exam.save()
    
    await AdmitCard.updateOne({ examId, studentId }, { $set: { isRescheduled: true, rescheduledReason: reason } })
    
    return NextResponse.json({ message: 'Exam rescheduled for student' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
