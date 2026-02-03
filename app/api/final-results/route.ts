import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FinalResult from '@/lib/models/FinalResult'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        await connectDB()
        const { searchParams } = new URL(req.url)
        const batchId = searchParams.get('batchId')
        const instituteId = searchParams.get('instituteId')

        const query: any = {}
        if (batchId) query.batchId = batchId
        if (instituteId) query.instituteId = instituteId

        const results = await FinalResult.find(query).populate('studentId', 'name rollNo motherName role documents aadhaarCardNo')
        return NextResponse.json(results)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
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
