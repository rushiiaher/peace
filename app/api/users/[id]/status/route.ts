import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB()
        const { status } = await req.json()

        if (!['Active', 'Inactive'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const user = await User.findByIdAndUpdate(
            params.id,
            { status },
            { new: true }
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 })
    }
}
