import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FinalResult from '@/lib/models/FinalResult'
import User from '@/lib/models/User'
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

        // lean() – no populate, safe in serverless
        const results = await FinalResult.find(query).lean()

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

        // Enrich each result with all related data
        const enriched = results.map((r: any) => ({
            ...r,
            studentId: studentMap[r.studentId?.toString()] || null,
            instituteId: instituteMap[r.instituteId?.toString()] || null,
            courseId: courseMap[r.courseId?.toString()] || null,
            batchId: batchMap[r.batchId?.toString()] || null,
        }))

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

        const operations = results.map((result: any) => ({
            updateOne: {
                filter: { studentId: result.studentId, courseId: result.courseId },
                update: {
                    $set: {
                        ...result,
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }))

        await FinalResult.bulkWrite(operations)
        return NextResponse.json({ message: 'Results saved successfully' })
    } catch (error) {
        console.error('Save results error:', error)
        return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }
}
