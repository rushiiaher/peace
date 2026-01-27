import { NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'
import Transaction from '@/lib/models/Transaction'
import User from '@/lib/models/User'
import { getEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        await connectDB()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentIds, // Array of internal Payment IDs to update
        } = await req.json()

        console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, paymentIds })

        const body = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', getEnv('RAZORPAY_KEY_SECRET'))
            .update(body.toString())
            .digest('hex')

        const isAuthentic = expectedSignature === razorpay_signature

        if (isAuthentic) {
            console.log(`✅ Payment Authenticated for Order: ${razorpay_order_id}`);

            // Update payment status in database
            const updateResult = await Payment.updateMany(
                { _id: { $in: paymentIds } },
                {
                    $set: {
                        status: 'Paid',
                        paymentMethod: 'Razorpay',
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        paidAt: new Date(),
                    },
                }
            )

            console.log(`📊 Payment Update Result: Valid: ${isAuthentic}, Modified: ${updateResult.modifiedCount}`);

            // Create Transaction records for Accounting
            const verifiedPayments = await Payment.find({ _id: { $in: paymentIds } })

            if (verifiedPayments.length === 0) {
                console.warn(`⚠️ Warning: No payments found for IDs: ${paymentIds}`);
            }

            const transactions = verifiedPayments.map((p: any) => ({
                type: 'Income',
                category: 'Fee Collection',
                description: `Fee collected from ${p.studentId?.name || 'Student'} (${p.courseId?.name || 'Course'})`,
                amount: p.totalAmount,
                instituteId: p.instituteId,
                paymentId: p._id,
                date: new Date(),
                commission: 0 // Entire amount is SA income
            }))

            if (transactions.length > 0) {
                await Transaction.insertMany(transactions)
                console.log(`💰 Created ${transactions.length} transaction records`);
            }

            // CRITICAL FIX: Update Student Course Status (Royalty Paid)
            // This enables Delivery workflow and Result generation visibility
            const updatePromises = verifiedPayments.map((p: any) =>
                User.updateOne(
                    {
                        _id: p.studentId,
                        'courses.courseId': p.courseId
                    },
                    {
                        $set: {
                            'courses.$.royaltyPaid': true,
                            'courses.$.royaltyPaidAt': new Date(),
                            'courses.$.royaltyAmount': p.totalAmount
                        }
                    }
                )
            )
            await Promise.all(updatePromises)
            console.log(`🎓 Updated ${updatePromises.length} student course records to 'Royalty Paid'`);

            return NextResponse.json({ success: true, message: 'Payment verified successfully' })
        } else {
            console.error(`❌ Invalid Signature for Order: ${razorpay_order_id}`);
            return NextResponse.json(
                { success: false, message: 'Invalid signature' },
                { status: 400 }
            )
        }
    } catch (error: any) {
        console.error('❌ Payment Verification Error:', error)
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        )
    }
}
