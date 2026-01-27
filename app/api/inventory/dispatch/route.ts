import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import FinalResult from '@/lib/models/FinalResult'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { type, ids, courseId } = await req.json()

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
        }

        if (type === 'book') {
            if (!courseId) return NextResponse.json({ error: 'Course ID required for books' }, { status: 400 })

            // Bulk update Users
            // Update the element in 'courses' array where courseId matches
            await User.updateMany(
                {
                    _id: { $in: ids },
                    'courses.courseId': courseId
                },
                {
                    $set: { 'courses.$.booksDispatched': true }
                }
            )
            return NextResponse.json({ message: 'Books marked as dispatched' })

        } else if (type === 'certificate') {
            await FinalResult.updateMany(
                { _id: { $in: ids } },
                {
                    $set: {
                        certificateDispatched: true,
                        certificateDispatchedAt: new Date()
                    }
                }
            )
            return NextResponse.json({ message: 'Certificates marked as dispatched' })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error) {
        console.error("Inventory Dispatch Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
