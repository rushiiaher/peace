import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Exam from '@/lib/models/Exam'
import '@/lib/models/Course'
import '@/lib/models/Institute'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const student = await User.findById(params.id).populate('courses.courseId')
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const now = new Date()
    // const activeCourses = student.courses.filter((c: any) => {
    //   if (!c.accessExpiresAt) return true
    //   return new Date(c.accessExpiresAt) > now
    // })
    const activeCourses = student.courses || []

    const courseIds = activeCourses.map((c: any) => c.courseId?._id || c.courseId).filter((id: any) => id)

    // Fetch all exams for these courses
    const exams = await Exam.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'name code')
      .populate('instituteId', 'name')
      .sort({ date: -1 })
      .lean() // Use lean() to allow modification

    // CRITICAL FIX: Filter exams based on student assignment
    // - DPP exams: Show to all students enrolled in the course
    // - Final exams: Only show if student is in systemAssignments OR if no systemAssignments exist
    const filteredExams = exams.filter((exam: any) => {
      // For DPP exams, show to all students enrolled in the course
      if (exam.type === 'DPP') {
        return true
      }

      // For Final exams, check systemAssignments
      if (exam.type === 'Final') {
        // If no systemAssignments exist, show to all students (backwards compatibility)
        if (!exam.systemAssignments || exam.systemAssignments.length === 0) {
          return true
        }

        // If systemAssignments exist, only show if student is assigned
        const isAssigned = exam.systemAssignments.some((assignment: any) =>
          (assignment.studentId?._id || assignment.studentId)?.toString() === params.id
        )
        return isAssigned
      }

      // For other exam types, show by default
      return true
    })

    // Auto-update status to Completed for expired exams
    const updates = []

    for (const exam of filteredExams) {
      if (exam.status !== 'Completed' && exam.date) {
        const examDate = new Date(exam.date)
        const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number)
        examDate.setHours(hours, minutes)

        // Add duration + buffer (e.g. 1 hour buffer)
        const endTime = new Date(examDate.getTime() + (exam.duration || 60) * 60000 + 60 * 60000)

        if (now > endTime) {
          exam.status = 'Completed'
          updates.push(exam._id)
        }
      }
    }

    if (updates.length > 0) {
      await Exam.updateMany(
        { _id: { $in: updates } },
        { $set: { status: 'Completed' } }
      )
    }

    return NextResponse.json(filteredExams)
  } catch (error: any) {
    console.error('Fetch student exams error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch exams' }, { status: 500 })
  }
}
