import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { paymentId, deliveryCharge } = await req.json()

        const payment = await Payment.findById(paymentId)
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // Idempotency check: If delivery charge is already set, don't add again (or update if different?)
        // We assume if it's set, we stick with it.
        if (payment.deliveryCharge > 0) {
            return NextResponse.json({ success: true, payment })
        }

        payment.deliveryCharge = deliveryCharge
        // Recalculate total
        payment.totalAmount = (payment.baseFee || 0) +
            (payment.examFee || 0) +
            (payment.bookPrice || 0) +
            (payment.certificateCharge || 0) +
            deliveryCharge

        await payment.save()

        return NextResponse.json({ success: true, payment })
    } catch (error: any) {
        console.error('Add Delivery Charge Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
