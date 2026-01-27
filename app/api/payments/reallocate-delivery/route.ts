import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { sourcePaymentId, targetPaymentId, deliveryAmount } = await req.json()

        if (!sourcePaymentId || !targetPaymentId) {
            return NextResponse.json({ error: 'Source and Target IDs required' }, { status: 400 })
        }

        const source = await Payment.findById(sourcePaymentId)
        const target = await Payment.findById(targetPaymentId)

        if (!source || !target) {
            return NextResponse.json({ error: 'Payments not found' }, { status: 404 })
        }

        if (source.status === 'Paid') {
            return NextResponse.json({ error: 'Source payment already paid' }, { status: 400 })
        }

        // Transfer logic
        // 1. Remove from source
        source.deliveryCharge = 0
        source.totalAmount -= deliveryAmount
        await source.save()

        // 2. Add to target
        target.deliveryCharge = deliveryAmount
        target.totalAmount += deliveryAmount
        await target.save()

        return NextResponse.json({ success: true, message: 'Delivery charge reallocated' })

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Reallocation failed' }, { status: 500 })
    }
}
