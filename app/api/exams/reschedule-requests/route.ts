import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import RescheduleRequest from '@/lib/models/RescheduleRequest'
import Exam from '@/lib/models/Exam'
import User from '@/lib/models/User' // For populating if needed

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { instituteId, originalExamId, requests } = await req.json()

        // Validate
        if (!instituteId || !originalExamId || !requests || !Array.isArray(requests) || requests.length === 0) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
        }

        const originalExam = await Exam.findById(originalExamId)
        if (!originalExam) return NextResponse.json({ error: 'Original exam not found' }, { status: 404 })

        const createdRequests = []
        const skippedStudents = []

        for (const reqData of requests) {
            const { studentId, reason } = reqData
            if (studentId && reason) {
                // Check if a request already exists for this student and exam
                const existingRequest = await RescheduleRequest.findOne({
                    originalExamId,
                    studentId,
                    status: { $in: ['Pending', 'Approved'] } // Don't allow duplicate if pending or approved
                })

                if (existingRequest) {
                    skippedStudents.push({
                        studentId,
                        reason: `Already has a ${existingRequest.status.toLowerCase()} request`
                    })
                    continue
                }

                const newReq = await RescheduleRequest.create({
                    instituteId,
                    originalExamId,
                    courseId: originalExam.courseId,
                    studentId,
                    reason
                })
                createdRequests.push(newReq)
            }
        }

        return NextResponse.json({
            message: 'Requests processed successfully',
            created: createdRequests.length,
            skipped: skippedStudents.length,
            skippedStudents
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to submit requests: ' + error.message }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        await connectDB()
        const { searchParams } = new URL(req.url)
        const instituteId = searchParams.get('instituteId')
        const status = searchParams.get('status')

        let query: any = {}
        if (instituteId) query.instituteId = instituteId
        if (status) query.status = status

        const requests = await RescheduleRequest.find(query)
            .populate('studentId', 'name rollNo')
            .populate('originalExamId', 'title date')
            .populate('courseId', 'name')
            .sort({ requestedAt: -1 })

        return NextResponse.json(requests)
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}
