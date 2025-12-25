import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import FinalResult from '@/lib/models/FinalResult'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { type, ids, courseId } = await req.json()

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
        }

        if (type === 'book') {
            if (!courseId) return NextResponse.json({ error: 'Course ID required for books' }, { status: 400 })

            await User.updateMany(
                {
                    _id: { $in: ids },
                    'courses.courseId': courseId
                },
                {
                    $set: { 'courses.$.booksReceived': true }
                }
            )
            return NextResponse.json({ message: 'Books marked as received' })

        } else if (type === 'certificate') {
            await FinalResult.updateMany(
                { _id: { $in: ids } },
                {
                    $set: {
                        certificateReceived: true,
                        certificateReceivedAt: new Date()
                    }
                }
            )
            return NextResponse.json({ message: 'Certificates marked as received' })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error) {
        console.error("Inventory Receive Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
