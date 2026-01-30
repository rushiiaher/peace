import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/lib/models/Exam'
import Institute from '@/lib/models/Institute'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import AdmitCard from '@/lib/models/AdmitCard'
import Batch from '@/lib/models/Batch'

export const dynamic = 'force-dynamic'

// Helper to parse time string "HH:MM" to minutes from midnight
const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

// Helper to convert minutes back to "HH:MM"
const minutesToTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export async function POST(req: Request) {
    try {
        await connectDB()
        const body = await req.json()
        const { instituteId, courseId, studentIds, proposedDate, title } = body

        // 1. Basic Validations
        if (!instituteId || !courseId || !studentIds || !studentIds.length || !proposedDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const examDate = new Date(proposedDate)
        const today = new Date()
        const diffTime = examDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Constraint: 6 Days Notice
        if (diffDays < 6) {
            return NextResponse.json({ error: 'Exam must be scheduled at least 6 days in advance' }, { status: 400 })
        }

        // 2. Fetch Resources
        const [institute, course, students] = await Promise.all([
            Institute.findById(instituteId),
            Course.findById(courseId),
            User.find({ _id: { $in: studentIds } }).lean()
        ])

        if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

        const availableSystems = institute.systems.filter((s: any) => s.status === 'Available')
        if (availableSystems.length === 0) {
            return NextResponse.json({ error: 'No systems marked available in institute' }, { status: 400 })
        }

        const { openingTime, closingTime, sectionDuration, breakBetweenSections } = institute.examTimings || {
            openingTime: '09:00', closingTime: '18:00', sectionDuration: 60, breakBetweenSections: 30
        }

        // Map students for quick lookup
        const studentMap = students.reduce((acc: any, s: any) => {
            acc[s._id.toString()] = s
            return acc
        }, {})

        // 3. Scheduling Logic
        const sections = []
        let remainingStudentIds = [...studentIds]
        let currentScheduleDate = new Date(examDate)

        let daysTried = 0
        while (remainingStudentIds.length > 0 && daysTried < 30) {

            const startOfDay = new Date(currentScheduleDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(currentScheduleDate)
            endOfDay.setHours(23, 59, 59, 999)

            // Find Existing Exams on this day
            const existingExams = await Exam.find({
                instituteId,
                'sections.date': { $gte: startOfDay, $lte: endOfDay }
            }).lean()

            const openingMin = timeToMinutes(openingTime)
            const closingMin = timeToMinutes(closingTime)
            let currentSlotStart = openingMin

            // Try slots in the day
            while (currentSlotStart + sectionDuration <= closingMin && remainingStudentIds.length > 0) {
                const currentSlotEnd = currentSlotStart + sectionDuration

                // Find Used Systems in this slot across multiple sections of existing exams
                const usedSystemNames = new Set<string>()

                existingExams.forEach((exam: any) => {
                    exam.sections.forEach((sec: any) => {
                        const secDate = new Date(sec.date)
                        // Simple date overlap check (ignoring timezone issues for demo simplicity - ideally use moment/date-fns)
                        if (secDate.getDate() !== currentScheduleDate.getDate() || secDate.getMonth() !== currentScheduleDate.getMonth()) return

                        const secStart = timeToMinutes(sec.startTime)
                        const secEnd = timeToMinutes(sec.endTime)

                        // Enforce Buffer Rule: System is reserved for [Start, End + Buffer]
                        // We check if the effective reserved periods overlap
                        const secReservedEnd = secEnd + breakBetweenSections
                        const currentReservedEnd = currentSlotEnd + breakBetweenSections

                        if (currentSlotStart < secReservedEnd && currentReservedEnd > secStart) {
                            sec.systemAssignments.forEach((sa: any) => usedSystemNames.add(sa.systemName))
                        }
                    })
                })

                // Filter Available Systems
                const systemsForThisSlot = availableSystems.filter((s: any) => !usedSystemNames.has(s.name))

                if (systemsForThisSlot.length > 0) {
                    // We can schedule a batch here!
                    const batchSize = Math.min(systemsForThisSlot.length, remainingStudentIds.length)
                    const batchStudents = remainingStudentIds.splice(0, batchSize)

                    const sectionAssignments = batchStudents.map((sid: string, idx: number) => ({
                        studentId: sid,
                        systemName: systemsForThisSlot[idx].name,
                        attended: false
                    }))

                    sections.push({
                        sectionNumber: sections.length + 1,
                        date: new Date(currentScheduleDate),
                        startTime: minutesToTime(currentSlotStart),
                        endTime: minutesToTime(currentSlotEnd),
                        systemAssignments: sectionAssignments
                    })
                }

                // Move allowed pointer
                currentSlotStart = currentSlotEnd + breakBetweenSections
            }

            // Move to next day
            currentScheduleDate.setDate(currentScheduleDate.getDate() + 1)
            daysTried++
        }

        if (remainingStudentIds.length > 0) {
            return NextResponse.json({ error: 'Could not schedule all students within 30 days.' }, { status: 400 })
        }

        // 4. Create Exam Record
        const finalTitle = title || `Final Exam - ${course.name}`
        const newExam = await Exam.create({
            courseId,
            instituteId,
            type: 'Final',
            title: finalTitle,
            date: new Date(proposedDate), // The requested date serves as base info
            duration: sectionDuration,
            totalMarks: 100, // Placeholder
            sections: sections,
            status: 'Scheduled',
            multiSection: sections.length > 1
        })

        // 5. Generate Admit Cards
        const admitCardPromises = sections.flatMap((section: any) =>
            section.systemAssignments.map(async (assignment: any) => {
                const student = studentMap[assignment.studentId.toString()]

                // Fetch student batch
                const batch = await Batch.findOne({
                    students: assignment.studentId,
                    courseId: courseId,
                    status: 'Active'
                })
                const batchName = batch ? batch.name : 'Regular Batch'

                return AdmitCard.create({
                    examId: newExam._id,
                    studentId: assignment.studentId,
                    studentName: student?.name || 'Unknown',
                    rollNo: student?.rollNo || 'N/A',
                    courseName: course.name,
                    batchName: batchName,
                    examTitle: finalTitle,
                    examDate: section.date,
                    startTime: section.startTime,
                    endTime: section.endTime,
                    duration: sectionDuration,
                    systemName: assignment.systemName,
                    instituteName: institute.name,
                    sectionNumber: section.sectionNumber,
                    isRescheduled: false
                })
            })
        )

        await Promise.all(admitCardPromises)

        return NextResponse.json({ message: 'Exam scheduled successfully', exam: newExam, sectionsCount: sections.length })
    } catch (error: any) {
        console.error('Exam Scheduling Error:', error)
        return NextResponse.json({ error: 'Scheduling failed: ' + error.message }, { status: 500 })
    }
}
