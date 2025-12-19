import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import User from '@/lib/models/User'
import AdmitCard from '@/lib/models/AdmitCard'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()
    
    const rescheduledExam = await Exam.findById(id).populate('courseId instituteId')
    if (!rescheduledExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }
    
    console.log('Rescheduled exam:', rescheduledExam.title)
    console.log('Rescheduled exam students:', rescheduledExam.systemAssignments?.length)
    
    const originalTitle = rescheduledExam.title.replace(' (Rescheduled)', '')
    const originalExam = await Exam.findOne({
      title: originalTitle,
      courseId: rescheduledExam.courseId._id,
      instituteId: rescheduledExam.instituteId._id
    })
    
    console.log('Original exam:', originalExam?.title)
    console.log('Original exam students:', originalExam?.systemAssignments?.length)
    
    if (!originalExam || !originalExam.systemAssignments) {
      console.log('Original exam not found or no students')
      return NextResponse.json({ students: [] })
    }
    
    // Get students already in rescheduled exam
    const rescheduledStudentIds = rescheduledExam.systemAssignments?.map((sa: any) => sa.studentId.toString()) || []
    console.log('Rescheduled student IDs:', rescheduledStudentIds)
    
    const availableStudents = []
    for (const assignment of originalExam.systemAssignments) {
      const studentId = assignment.studentId.toString()
      
      if (!rescheduledStudentIds.includes(studentId)) {
        const student = await User.findById(studentId).select('name rollNo')
        if (student) {
          availableStudents.push({
            studentId,
            rollNo: student.rollNo,
            name: student.name,
            scheduledDate: originalExam.date,
            scheduledTime: originalExam.startTime,
            systemName: assignment.systemName,
            totalMarks: originalExam.totalMarks,
            hasAttempted: false,
            questionsAttempted: 0,
            score: 0
          })
        }
      }
    }
    
    console.log('Available students:', availableStudents.length)
    return NextResponse.json({ students: availableStudents })
  } catch (error: any) {
    console.error('Available students API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
