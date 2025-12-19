import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB()
        const { status } = await req.json()

        if (!['Active', 'Inactive'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const institute = await Institute.findByIdAndUpdate(
            params.id,
            { status },
            { new: true }
        )

        if (!institute) {
            return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
        }

        return NextResponse.json(institute)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 })
    }
}
