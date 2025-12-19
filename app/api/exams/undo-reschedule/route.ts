import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { examId } = await req.json()
    
    const rescheduledExam = await Exam.findById(examId)
    if (!rescheduledExam) return NextResponse.json({ error: 'Rescheduled exam not found' }, { status: 404 })
    
    // Find original exam by removing (Rescheduled) from title
    const originalTitle = rescheduledExam.title.replace(' (Rescheduled)', '')
    const originalExam = await Exam.findOne({ 
      title: originalTitle,
      courseId: rescheduledExam.courseId,
      instituteId: rescheduledExam.instituteId
    })
    
    if (!originalExam) return NextResponse.json({ error: 'Original exam not found' }, { status: 404 })
    
    // Move students back to original exam
    if (rescheduledExam.systemAssignments) {
      if (!originalExam.systemAssignments) originalExam.systemAssignments = []
      originalExam.systemAssignments.push(...rescheduledExam.systemAssignments)
    }
    
    // Update admit cards back to original exam
    await AdmitCard.updateMany(
      { examId: rescheduledExam._id },
      {
        $set: {
          examId: originalExam._id,
          examDate: originalExam.date,
          startTime: originalExam.startTime,
          endTime: originalExam.endTime,
          isRescheduled: false
        },
        $unset: {
          rescheduledReason: 1
        }
      }
    )
    
    // Save original exam and delete rescheduled exam
    originalExam.markModified('systemAssignments')
    await originalExam.save()
    await Exam.findByIdAndDelete(examId)
    
    return NextResponse.json({ message: 'Reschedule undone successfully - students moved back to original exam' })
  } catch (error: any) {
    console.error('Undo reschedule error:', error)
    return NextResponse.json({ error: error.message || 'Failed to undo reschedule' }, { status: 500 })
  }
}