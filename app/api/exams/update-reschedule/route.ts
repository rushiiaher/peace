import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import Institute from '@/lib/models/Institute'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { examId, studentIds, rescheduleDate, reason } = await req.json()
    
    console.log('Update reschedule request:', { examId, studentIds, rescheduleDate, reason })
    
    const rescheduledExam = await Exam.findById(examId).populate('courseId instituteId')
    if (!rescheduledExam) return NextResponse.json({ error: 'Rescheduled exam not found' }, { status: 404 })
    
    console.log('Rescheduled exam found:', rescheduledExam.title)
    
    // Update exam date
    rescheduledExam.date = new Date(rescheduleDate)
    
    // Find existing students in rescheduled exam
    const existingStudentIds = rescheduledExam.systemAssignments?.map((sa: any) => sa.studentId.toString()) || []
    console.log('Existing students in rescheduled exam:', existingStudentIds)
    
    // Separate new students from existing ones
    const newStudentIds = studentIds.filter((id: string) => !existingStudentIds.includes(id))
    const existingSelectedIds = studentIds.filter((id: string) => existingStudentIds.includes(id))
    const unselectedStudentIds = existingStudentIds.filter((id: string) => !studentIds.includes(id))
    
    console.log('New students to add:', newStudentIds)
    console.log('Existing students to update:', existingSelectedIds)
    console.log('Students to remove:', unselectedStudentIds)
    
    // Update admit cards for existing students (date and reason)
    if (existingSelectedIds.length > 0) {
      const updateResult = await AdmitCard.updateMany(
        { examId, studentId: { $in: existingSelectedIds } },
        {
          $set: {
            examDate: new Date(rescheduleDate),
            rescheduledReason: reason
          }
        }
      )
      console.log('Updated admit cards:', updateResult.modifiedCount)
      
      // Update rescheduledReason in systemAssignments
      rescheduledExam.systemAssignments = rescheduledExam.systemAssignments?.map((sa: any) => {
        if (existingSelectedIds.includes(sa.studentId.toString())) {
          sa.rescheduledReason = reason
        }
        return sa
      })
    }
    
    // Remove unselected students
    if (unselectedStudentIds.length > 0) {
      // Remove from rescheduled exam
      rescheduledExam.systemAssignments = rescheduledExam.systemAssignments?.filter(
        (sa: any) => !unselectedStudentIds.includes(sa.studentId.toString())
      )
      
      // Delete their admit cards
      await AdmitCard.deleteMany({
        examId,
        studentId: { $in: unselectedStudentIds }
      })
      
      // Add them back to original exam
      const originalTitle = rescheduledExam.title.replace(' (Rescheduled)', '')
      const originalExam = await Exam.findOne({
        title: originalTitle,
        courseId: rescheduledExam.courseId._id,
        instituteId: rescheduledExam.instituteId._id
      })
      
      if (originalExam) {
        for (const studentId of unselectedStudentIds) {
          const removedAssignment = existingStudentIds.find((id: string) => id === studentId)
          if (removedAssignment) {
            const sa = rescheduledExam.systemAssignments?.find((s: any) => s.studentId.toString() === studentId)
            if (sa) {
              originalExam.systemAssignments = originalExam.systemAssignments || []
              originalExam.systemAssignments.push({
                studentId,
                systemName: sa.systemName,
                sectionNumber: sa.sectionNumber,
                attended: false,
                isRescheduled: false
              })
            }
          }
        }
        originalExam.markModified('systemAssignments')
        await originalExam.save()
        console.log('Moved unselected students back to original exam')
      }
    }
    
    // Add new students from original exam
    if (newStudentIds.length > 0) {
      console.log('Adding new students:', newStudentIds)
      
      // Find original exam
      const originalTitle = rescheduledExam.title.replace(' (Rescheduled)', '')
      const originalExam = await Exam.findOne({
        title: originalTitle,
        courseId: rescheduledExam.courseId._id,
        instituteId: rescheduledExam.instituteId._id
      })
      
      if (!originalExam) {
        return NextResponse.json({ error: 'Original exam not found' }, { status: 404 })
      }
      
      console.log('Original exam found:', originalExam._id)
      
      const institute = await Institute.findById(rescheduledExam.instituteId)
      const course = await Course.findById(rescheduledExam.courseId)
      
      const newAssignments = []
      const newAdmitCards = []
      
      for (const studentId of newStudentIds) {
        const originalAssignment = originalExam.systemAssignments?.find(
          (sa: any) => sa.studentId.toString() === studentId
        )
        
        if (originalAssignment) {
          const student = await User.findById(studentId)
          
          newAssignments.push({
            studentId,
            systemName: originalAssignment.systemName,
            sectionNumber: 999,
            attended: false,
            isRescheduled: true,
            rescheduledReason: reason
          })
          
          newAdmitCards.push({
            examId: rescheduledExam._id,
            studentId,
            studentName: student?.name,
            rollNo: student?.rollNo,
            courseName: course?.name,
            examTitle: rescheduledExam.title,
            examDate: new Date(rescheduleDate),
            startTime: rescheduledExam.startTime,
            endTime: rescheduledExam.endTime,
            duration: rescheduledExam.duration,
            systemName: originalAssignment.systemName,
            instituteName: institute?.name,
            sectionNumber: 999,
            isRescheduled: true,
            rescheduledReason: reason
          })
        }
      }
      
      if (newAdmitCards.length > 0) {
        await AdmitCard.insertMany(newAdmitCards)
        console.log('Created admit cards:', newAdmitCards.length)
      }
      
      if (newAssignments.length > 0) {
        rescheduledExam.systemAssignments = [...(rescheduledExam.systemAssignments || []), ...newAssignments]
        console.log('Added assignments to rescheduled exam')
      }
      
      // Remove students from original exam
      for (const studentId of newStudentIds) {
        originalExam.systemAssignments = originalExam.systemAssignments?.filter(
          (sa: any) => sa.studentId.toString() !== studentId
        ) || []
      }
      
      originalExam.markModified('systemAssignments')
      await originalExam.save()
      console.log('Removed students from original exam')
    }
    
    rescheduledExam.markModified('systemAssignments')
    await rescheduledExam.save()
    console.log('Saved rescheduled exam')
    
    const message = [
      existingSelectedIds.length > 0 && `Updated ${existingSelectedIds.length} student(s)`,
      newStudentIds.length > 0 && `Added ${newStudentIds.length} new student(s)`,
      unselectedStudentIds.length > 0 && `Removed ${unselectedStudentIds.length} student(s)`
    ].filter(Boolean).join(', ')
    
    return NextResponse.json({ 
      message: message || 'No changes made'
    })
  } catch (error: any) {
    console.error('Update reschedule error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update reschedule' }, { status: 500 })
  }
}
