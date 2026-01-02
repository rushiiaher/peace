import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB()
        const { date, startTime, endTime, systemAssignments } = await req.json()

        const examId = params.id

        // Find the exam
        const exam = await Exam.findById(examId)
        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Update exam
        exam.date = new Date(date)
        exam.startTime = startTime
        exam.endTime = endTime
        exam.systemAssignments = systemAssignments

        await exam.save()

        // Update all admit cards for this exam
        for (const assignment of systemAssignments) {
            await AdmitCard.findOneAndUpdate(
                {
                    examId: examId,
                    studentId: assignment.studentId
                },
                {
                    examDate: new Date(date),
                    startTime: startTime,
                    endTime: endTime,
                    systemName: assignment.systemName
                }
            )
        }

        return NextResponse.json({
            message: 'Exam schedule updated successfully',
            exam
        })
    } catch (error: any) {
        console.error('Error updating exam schedule:', error)
        return NextResponse.json({
            error: error.message || 'Failed to update exam schedule'
        }, { status: 500 })
    }
}
