import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import connectDB from '@/lib/mongodb'

import { getEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

const razorpay = new Razorpay({
    key_id: getEnv('RAZORPAY_KEY_ID'),
    key_secret: getEnv('RAZORPAY_KEY_SECRET'),
})

export async function POST(req: Request) {
    try {
        const { amount, currency = 'INR', receipt } = await req.json()

        console.log('Creating Razorpay order:', { amount, currency, receipt })

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit
            currency,
            receipt,
        }

        const order = await razorpay.orders.create(options)
        console.log('Razorpay order created:', order)

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Razorpay Order Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create Razorpay order' },
            { status: 500 }
        )
    }
}
