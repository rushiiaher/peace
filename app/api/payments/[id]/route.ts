import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    
    if (data.status === 'Paid' && !data.paidAt) {
      data.paidAt = new Date()
    }
    
    const payment = await Payment.findByIdAndUpdate(params.id, data, { new: true })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    
    return NextResponse.json(payment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update payment' }, { status: 500 })
  }
}
