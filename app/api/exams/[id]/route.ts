import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const exam = await Exam.findById(params.id)
      .populate('courseId', 'name code examConfigurations')
      .populate('instituteId', 'name')
      .populate('systemAssignments.studentId', 'name email rollNo')
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    return NextResponse.json(exam)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    console.log('PUT /api/exams/[id] - ID:', params.id, 'Data:', data)

    const exam = await Exam.findById(params.id)
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Handle Smart Rescheduling (Shifting all sections)
    if (data.date && new Date(data.date).getTime() !== new Date(exam.date).getTime()) {
      const oldDate = new Date(exam.date)
      const newDate = new Date(data.date)
      const diffTime = newDate.getTime() - oldDate.getTime()

      // Update main date
      exam.date = newDate

      // Update Sections and Admit Cards
      if (exam.sections && exam.sections.length > 0) {
        // Import dynamically to avoid circular deps if any, though standard import is fine usually
        const AdmitCard = (await import('@/lib/models/AdmitCard')).default

        const updatePromises = exam.sections.map(async (section: any) => {
          const oldSecDate = new Date(section.date)
          // Apply safe date shift
          const newSecDate = new Date(oldSecDate.getTime() + diffTime)
          section.date = newSecDate

          // Update Admit Cards for this section
          // Note: Using sectionNumber to target specific batch of students
          await AdmitCard.updateMany(
            { examId: exam._id, sectionNumber: section.sectionNumber },
            { $set: { examDate: newSecDate } }
          )
        })
        await Promise.all(updatePromises)
      } else {
        // Fallback
        const AdmitCard = (await import('@/lib/models/AdmitCard')).default
        await AdmitCard.updateMany({ examId: exam._id }, { $set: { examDate: newDate } })
      }
    }

    // Update other fields
    if (data.title) exam.title = data.title
    if (data.duration) exam.duration = data.duration
    if (data.totalMarks) exam.totalMarks = data.totalMarks
    if (data.status) exam.status = data.status
    if (data.attendanceEnabled !== undefined) exam.attendanceEnabled = data.attendanceEnabled

    await exam.save()

    return NextResponse.json(exam)
  } catch (error: any) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const exam = await Exam.findById(params.id)
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    if (exam.type === 'DPP' && exam.questionBankId) {
      const QuestionBank = (await import('@/lib/models/QuestionBank')).default
      await QuestionBank.findByIdAndUpdate(exam.questionBankId, { hasDPP: false })
    }

    await Exam.findByIdAndDelete(params.id)

    const AdmitCard = (await import('@/lib/models/AdmitCard')).default
    await AdmitCard.deleteMany({ examId: params.id })

    return NextResponse.json({ message: 'Exam deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
