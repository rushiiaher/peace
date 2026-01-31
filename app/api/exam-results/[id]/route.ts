import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamResult from '@/lib/models/ExamResult'
import '@/lib/models/Exam'
import '@/lib/models/Course'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    try {
        await connectDB()
        const result = await ExamResult.findById(params.id)
            .populate({
                path: 'examId',
                populate: { path: 'courseId', select: 'name code' }
            })

        if (!result) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Fetch Single Exam Result Error:", error)
        return NextResponse.json({ error: error.message || 'Failed to fetch result' }, { status: 500 })
    }
}
