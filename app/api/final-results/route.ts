import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FinalResult from '@/lib/models/FinalResult'
import mongoose from 'mongoose'
// Import referenced models so Mongoose registers them before populate runs
import '@/lib/models/Batch'
import '@/lib/models/Course'
import '@/lib/models/User'
import '@/lib/models/Institute'

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

        const results = await FinalResult.find(query)
            .populate('studentId', 'name rollNo motherName role documents aadhaarCardNo email phone')

        return NextResponse.json(results)
    } catch (error: any) {
        console.error("Fetch final results error:", error)
        return NextResponse.json(
            { error: 'Failed to fetch results', details: error?.message || String(error) },
            { status: 500 }
        )
    }
}


export async function POST(req: Request) {
    try {
        await connectDB()
        const { results } = await req.json() // Expecting array of result objects

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
        console.error("Save results error:", error)
        return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }
}
