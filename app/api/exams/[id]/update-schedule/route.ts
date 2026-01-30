import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import AdmitCard from '@/lib/models/AdmitCard'

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        await connectDB()
        const { date, startTime, endTime, systemAssignments } = await req.json()

        const examId = params.id

        // Find the exam
        const exam = await Exam.findById(examId).populate('instituteId')
        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const institute = exam.instituteId

        // Validate opening/closing time
        const getMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number)
            return h * 60 + m
        }

        const examDateTime = new Date(date)
        const examStartMins = getMinutes(startTime)
        const examEndMins = getMinutes(endTime)

        const { examTimings } = institute
        if (examTimings) {
            // Check working day
            const dayOfWeek = examDateTime.getDay()
            const workingDays = examTimings.workingDays || [1, 2, 3, 4, 5, 6]
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

            if (!workingDays.includes(dayOfWeek)) {
                return NextResponse.json({
                    error: `Institute is closed on ${days[dayOfWeek]}s`
                }, { status: 400 })
            }

            // Check time bounds
            const openMins = getMinutes(examTimings.openingTime || '09:00')
            const closeMins = getMinutes(examTimings.closingTime || '18:00')

            if (examStartMins < openMins) {
                return NextResponse.json({
                    error: `Exam cannot start before opening time (${examTimings.openingTime})`
                }, { status: 400 })
            }
            if (examStartMins >= closeMins) {
                return NextResponse.json({
                    error: `Exam cannot start at or after closing time (${examTimings.closingTime})`
                }, { status: 400 })
            }
            if (examEndMins > closeMins) {
                return NextResponse.json({
                    error: `Exam ends at ${endTime}, which is after closing time (${examTimings.closingTime})`
                }, { status: 400 })
            }
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
