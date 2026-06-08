import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FinalResult from '@/lib/models/FinalResult'
import User from '@/lib/models/User'
import Exam from '@/lib/models/Exam'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        await connectDB()
        const { searchParams } = new URL(req.url)
        const batchId = searchParams.get('batchId')
        const instituteId = searchParams.get('instituteId')
        const courseId = searchParams.get('courseId')

        const isValidId = (id: string | null) =>
            id && id !== 'all' && mongoose.Types.ObjectId.isValid(id)

        const query: any = {}
        if (isValidId(batchId)) query.batchId = batchId
        if (isValidId(instituteId)) query.instituteId = instituteId
        if (isValidId(courseId)) query.courseId = courseId

        // Sort newest first by submission time
        const results = await FinalResult.find(query)
            .sort({ submittedAt: -1, updatedAt: -1, createdAt: -1 })
            .lean()

        // Collect unique IDs for batch lookups
        const studentIds = [...new Set(results.map((r: any) => r.studentId?.toString()).filter(Boolean))]
        const instituteIds = [...new Set(results.map((r: any) => r.instituteId?.toString()).filter(Boolean))]
        const courseIds = [...new Set(results.map((r: any) => r.courseId?.toString()).filter(Boolean))]
        const batchIds = [...new Set(results.map((r: any) => r.batchId?.toString()).filter(Boolean))]

        // Dynamic imports ensure models are registered before use
        const Institute = (await import('@/lib/models/Institute')).default
        const Course = (await import('@/lib/models/Course')).default
        const Batch = (await import('@/lib/models/Batch')).default

        // Parallel batch fetches
        const [students, institutes, courses, batches] = await Promise.all([
            studentIds.length > 0
                ? User.find({ _id: { $in: studentIds } })
                    .select('name rollNo motherName role documents aadhaarCardNo email phone')
                    .lean()
                : [],
            instituteIds.length > 0
                ? Institute.find({ _id: { $in: instituteIds } }).select('name code').lean()
                : [],
            courseIds.length > 0
                ? Course.find({ _id: { $in: courseIds } }).select('name code').lean()
                : [],
            batchIds.length > 0
                ? Batch.find({ _id: { $in: batchIds } }).select('name').lean()
                : [],
        ])

        // Build lookup maps
        const toMap = (arr: any[]) =>
            Object.fromEntries(arr.map((x: any) => [x._id.toString(), x]))

        const studentMap = toMap(students as any[])
        const instituteMap = toMap(institutes as any[])
        const courseMap = toMap(courses as any[])
        const batchMap = toMap(batches as any[])

        // ─── Per-student exam date lookup ────────────────────────────────────────
        // The CORRECT exam date for each student is the date of the specific
        // exam section they were assigned to — NOT the Exam's root date, NOT
        // updatedAt (which changes every time marks are re-submitted).
        //
        // Priority: section.systemAssignments → top-level systemAssignments
        //           → exam.date (fallback for un-sectioned exams)
        const finalExams = courseIds.length > 0
            ? await Exam.find({
                type: 'Final',
                courseId: { $in: courseIds },
            }).select('courseId instituteId date sections systemAssignments').lean()
            : []

        // studentId (string) → Date of the section they sat
        const studentExamDateMap: Record<string, Date> = {}

        for (const exam of finalExams as any[]) {
            const mainDate: Date = new Date(exam.date)

            if (exam.sections && exam.sections.length > 0) {
                // Build sectionNumber → Date map
                const sectionDateByNum: Record<number, Date> = {}
                for (const sec of exam.sections) {
                    const secDate = sec.date ? new Date(sec.date) : mainDate
                    sectionDateByNum[sec.sectionNumber] = secDate

                    // Assign from section-level systemAssignments
                    for (const a of (sec.systemAssignments || [])) {
                        const sid = a.studentId?._id?.toString() || a.studentId?.toString()
                        if (sid && !studentExamDateMap[sid]) {
                            studentExamDateMap[sid] = secDate
                        }
                    }
                }

                // Assign from top-level systemAssignments (have sectionNumber field)
                for (const a of (exam.systemAssignments || [])) {
                    const sid = a.studentId?._id?.toString() || a.studentId?.toString()
                    if (sid && !studentExamDateMap[sid]) {
                        const secNum = a.sectionNumber ?? 1
                        studentExamDateMap[sid] = sectionDateByNum[secNum] || mainDate
                    }
                }
            } else {
                // Single-date exam — all students share the same date
                for (const a of (exam.systemAssignments || [])) {
                    const sid = a.studentId?._id?.toString() || a.studentId?.toString()
                    if (sid && !studentExamDateMap[sid]) {
                        studentExamDateMap[sid] = mainDate
                    }
                }
            }
        }

        // Enrich each result
        const enriched = results.map((r: any) => {
            const origStudentId = r.studentId?.toString()

            // Per-student exam date (static — from the Exam section they sat)
            const examDate: Date | null = origStudentId
                ? (studentExamDateMap[origStudentId] || null)
                : null

            return {
                ...r,
                studentId: studentMap[origStudentId] || null,
                instituteId: instituteMap[r.instituteId?.toString()] || null,
                courseId: courseMap[r.courseId?.toString()] || null,
                batchId: batchMap[r.batchId?.toString()] || null,
                // examDate: actual date the student sat the exam (from Exam model, per section)
                examDate: examDate ? examDate.toISOString() : null,
            }
        }).filter((r: any) => r.studentId !== null)

        return NextResponse.json(enriched)
    } catch (error: any) {
        console.error('Fetch final results error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch results', details: error?.message || String(error) },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        await connectDB()
        const { results } = await req.json()

        const operations = results.map((result: any) => {
            const updateFields: any = {
                ...result,
                updatedAt: new Date()
            }

            // Set submittedAt timestamp when first submitting to super admin
            // Only set it if not already present (preserve original submission time on re-saves)
            if (result.submittedToSuperAdmin && !result.submittedAt) {
                updateFields.submittedAt = new Date()
            } else if (result.submittedAt) {
                updateFields.submittedAt = new Date(result.submittedAt)
            }

            return {
                updateOne: {
                    filter: { studentId: result.studentId, courseId: result.courseId },
                    update: {
                        $set: updateFields
                    },
                    upsert: true
                }
            }
        })

        await FinalResult.bulkWrite(operations)
        return NextResponse.json({ message: 'Results saved successfully' })
    } catch (error) {
        console.error('Save results error:', error)
        return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }
}
