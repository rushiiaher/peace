import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import RescheduleRequest from '@/lib/models/RescheduleRequest'
import Exam from '@/lib/models/Exam'
import Institute from '@/lib/models/Institute'
import AdmitCard from '@/lib/models/AdmitCard'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import Batch from '@/lib/models/Batch'

export const dynamic = 'force-dynamic'

// Helper helpers
const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}
const minutesToTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export async function POST(req: Request) {
    try {
        await connectDB()
        const { requestIds, approve } = await req.json()

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return NextResponse.json({ error: 'No requests selected' }, { status: 400 })
        }

        if (!approve) {
            // Rejection Logic
            await RescheduleRequest.updateMany(
                { _id: { $in: requestIds } },
                { $set: { status: 'Rejected', processedAt: new Date() } }
            )
            return NextResponse.json({ message: 'Requests rejected' })
        }

        // Approval Logic -> Auto Schedule
        // 1. Group requests by Institute and Course (Assuming we schedule separately per course/institute)
        // For simplicity, we assume the Super Admin selects requests that logically belong together or we iterate groups.
        // Let's iterate through unique OriginalExamIds involved to keep it grouped.

        const requests = await RescheduleRequest.find({ _id: { $in: requestIds }, status: 'Pending' })
            .populate('originalExamId')
            .populate('instituteId')
            .populate('studentId')
            .populate('courseId')

        if (requests.length === 0) return NextResponse.json({ error: 'No pending requests found' }, { status: 400 })

        // Group by Original Exam to preserve context
        const groups: { [key: string]: any[] } = {}
        requests.forEach((r: any) => {
            const key = r.originalExamId._id.toString()
            if (!groups[key]) groups[key] = []
            groups[key].push(r)
        })

        const results = []

        for (const examId in groups) {
            const groupRequests = groups[examId]
            const sampleReq = groupRequests[0]
            const institute = sampleReq.instituteId
            const originalExam = sampleReq.originalExamId
            const studentIds = groupRequests.map(r => r.studentId._id)
            const studentMap = groupRequests.reduce((acc: any, r: any) => {
                acc[r.studentId._id.toString()] = r.studentId
                return acc
            }, {})

            let newExam: any = null

            try {
                // Fetch course to get exam configuration
                const course = await Course.findById(originalExam.courseId)
                const examConfig = course?.examConfigurations?.[0]
                const courseExamDuration = examConfig?.duration || null

                // Resource Allocation Logic (Simplified version of schedule route)
                // Accept both 'Available' and 'Active' status systems
                const availableSystems = institute.systems.filter((s: any) => s.status === 'Available' || s.status === 'Active')
                if (availableSystems.length === 0) {
                    throw new Error(`No systems available at ${institute.name}`)
                }

                const { openingTime, closingTime, sectionDuration, breakBetweenSections } = institute.examTimings || {
                    openingTime: '09:00', closingTime: '18:00', sectionDuration: courseExamDuration || 180, breakBetweenSections: 30
                }

                // Find next available slot starting TOMORROW
                let scheduled = false
                let currentScheduleDate = new Date()
                currentScheduleDate.setDate(currentScheduleDate.getDate() + 1) // Start tomorrow

                let finalSection: any = null

                let daysTried = 0
                while (!scheduled && daysTried < 14) {
                    const startOfDay = new Date(currentScheduleDate)
                    startOfDay.setHours(0, 0, 0, 0)
                    const endOfDay = new Date(currentScheduleDate)
                    endOfDay.setHours(23, 59, 59, 999)

                    const existingExams = await Exam.find({
                        instituteId: institute._id,
                        'sections.date': { $gte: startOfDay, $lte: endOfDay }
                    }).lean()

                    const openingMin = timeToMinutes(openingTime)
                    const closingMin = timeToMinutes(closingTime)
                    let currentSlotStart = openingMin

                    while (currentSlotStart + sectionDuration <= closingMin && !scheduled) {
                        const currentSlotEnd = currentSlotStart + sectionDuration

                        // Check used systems
                        const usedSystemNames = new Set<string>()
                        existingExams.forEach((exam: any) => {
                            exam.sections.forEach((sec: any) => {
                                // Date overlap check
                                const secDate = new Date(sec.date)
                                if (secDate.getDate() !== currentScheduleDate.getDate()) return
                                const secStart = timeToMinutes(sec.startTime)
                                const secEnd = timeToMinutes(sec.endTime)

                                // Enforce Buffer Rule for Rescheduling
                                const secReservedEnd = secEnd + breakBetweenSections
                                const currentReservedEnd = currentSlotEnd + breakBetweenSections

                                if (currentSlotStart < secReservedEnd && currentReservedEnd > secStart) {
                                    sec.systemAssignments.forEach((sa: any) => usedSystemNames.add(sa.systemName))
                                }
                            })
                        })

                        const systemsForThisSlot = availableSystems.filter((s: any) => !usedSystemNames.has(s.name))

                        if (systemsForThisSlot.length >= studentIds.length) {
                            // Success!
                            const assignedSystems = systemsForThisSlot.slice(0, studentIds.length)
                            const assignments = studentIds.map((sid: any, idx: number) => ({
                                studentId: sid,
                                systemName: assignedSystems[idx].name,
                                attended: false
                            }))

                            finalSection = {
                                sectionNumber: 1,
                                date: new Date(currentScheduleDate),
                                startTime: minutesToTime(currentSlotStart),
                                endTime: minutesToTime(currentSlotEnd),
                                systemAssignments: assignments
                            }
                            scheduled = true
                        }

                        currentSlotStart = currentSlotEnd + breakBetweenSections
                    }
                    currentScheduleDate.setDate(currentScheduleDate.getDate() + 1)
                    daysTried++
                }

                if (!scheduled) {
                    throw new Error(`Could not find a slot for ${groupRequests.length} students at ${institute.name}`)
                }

                // Create Rescheduled Exam
                const newTitle = `${originalExam.title} (Rescheduled)`
                newExam = await Exam.create({
                    courseId: originalExam.courseId,
                    instituteId: institute._id,
                    type: 'Final',
                    title: newTitle,
                    date: finalSection.date,
                    duration: sectionDuration,
                    totalMarks: originalExam.totalMarks,
                    sections: [finalSection],
                    systemAssignments: finalSection.systemAssignments,
                    status: 'Scheduled',
                    multiSection: false,
                    examNumber: originalExam.examNumber,
                    questions: originalExam.questions,
                    attendanceEnabled: false
                })

                // Generate Admit Cards
                await Promise.all(finalSection.systemAssignments.map(async (assign: any) => {
                    // Find reason
                    const req = groupRequests.find(r => r.studentId._id.toString() === assign.studentId.toString())
                    const student = studentMap[assign.studentId.toString()]

                    // Fetch student's batch for this course
                    const batch = await Batch.findOne({
                        students: assign.studentId,
                        courseId: originalExam.courseId,
                        status: 'Active'
                    })
                    const batchName = batch ? batch.name : 'Regular Batch'

                    return AdmitCard.create({
                        examId: newExam._id,
                        studentId: assign.studentId,
                        studentName: student.name,
                        rollNo: student.rollNo || 'N/A',
                        courseName: sampleReq.courseId.name,
                        batchName: batchName,
                        examTitle: newTitle,
                        examDate: finalSection.date,
                        startTime: finalSection.startTime,
                        endTime: finalSection.endTime,
                        duration: sectionDuration,
                        systemName: assign.systemName,
                        instituteName: institute.name,
                        sectionNumber: 1,
                        isRescheduled: true,
                        rescheduledReason: req?.reason || 'Rescheduled'
                    })
                }))

                // Update Requests
                await RescheduleRequest.updateMany(
                    { _id: { $in: groupRequests.map(r => r._id) } },
                    { $set: { status: 'Approved', processedAt: new Date(), newExamId: newExam._id } }
                )

                results.push(newExam)

            } catch (error) {
                console.error("Group Processing Error", error)
                // Rollback if exam was created but subsequent steps failed
                if (newExam) {
                    console.log(`Rolling back exam creation: ${newExam._id}`)
                    await Exam.findByIdAndDelete(newExam._id)
                    await AdmitCard.deleteMany({ examId: newExam._id })
                }
                throw error
            }

        }

        return NextResponse.json({ message: 'Approved and Scheduled', scheduledExams: results })

    } catch (error: any) {
        console.error("Approval Error", error)
        return NextResponse.json({ error: 'Process failed: ' + error.message }, { status: 500 })
    }
}
