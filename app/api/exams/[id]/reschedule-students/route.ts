import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import User from '@/lib/models/User'
import ExamResult from '@/lib/models/ExamResult'
import AdmitCard from '@/lib/models/AdmitCard'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('Fetching exam for reschedule:', id)
    await connectDB()
    const exam = await Exam.findById(id).populate('courseId instituteId')
    if (!exam) {
      console.log('Exam not found:', id)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    console.log('Exam found:', exam.title, 'Type:', exam.type)
    console.log('System assignments:', exam.systemAssignments?.length || 0)

    if (!exam.systemAssignments || exam.systemAssignments.length === 0) {
      console.log('No system assignments found')
      return NextResponse.json({ exam, students: [] })
    }

    const studentData = []
    for (const assignment of exam.systemAssignments) {
      const student = await User.findById(assignment.studentId).select('name rollNo email')
      console.log('Student found:', assignment.studentId, student?.name, student?.rollNo)
      const result = await ExamResult.findOne({ examId: exam._id, studentId: assignment.studentId })
      const admitCard = await AdmitCard.findOne({ examId: exam._id, studentId: assignment.studentId })

      const questionsAttempted = result?.answers ? result.answers.filter((a: number) => a !== null && a !== undefined).length : 0

      // Use rescheduled date from admit card if available, otherwise use original exam date
      const scheduledDate = assignment.isRescheduled && admitCard ? admitCard.examDate : exam.date
      const scheduledTime = assignment.isRescheduled && admitCard ? admitCard.startTime : exam.startTime

      studentData.push({
        studentId: assignment.studentId.toString(),
        name: student?.name,
        rollNo: student?.rollNo,
        email: student?.email,
        originalDate: exam.date,
        originalTime: exam.startTime,
        scheduledDate,
        scheduledTime,
        systemName: assignment.systemName,
        sectionNumber: assignment.sectionNumber || 1,
        attended: assignment.attended,
        rescheduled: assignment.isRescheduled || false,
        rescheduledReason: assignment.rescheduledReason,
        questionsAttempted,
        score: result?.score || 0,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.questions?.length || 0,
        hasAttempted: !!result
      })
    }

    return NextResponse.json({ exam, students: studentData })
  } catch (error: any) {
    console.error('Reschedule-students API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
