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

        // Use lean() for plain objects, then manually attach student data
        const results = await FinalResult.find(query).lean()

        // Collect unique student IDs
        const studentIds = [...new Set(results.map((r: any) => r.studentId?.toString()).filter(Boolean))]

        // Fetch all relevant students in one query
        const students = studentIds.length > 0
            ? await User.find({ _id: { $in: studentIds } })
                .select('name rollNo motherName role documents aadhaarCardNo email phone')
                .lean()
            : []

        // Build a lookup map
        const studentMap: Record<string, any> = {}
        students.forEach((s: any) => { studentMap[s._id.toString()] = s })

        // Attach student data to each result
        const enriched = results.map((r: any) => ({
            ...r,
            studentId: studentMap[r.studentId?.toString()] || null
        }))

        return NextResponse.json(enriched)
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
