import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeePayment from '@/lib/models/FeePayment'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const studentId = searchParams.get('studentId')
    
    const query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (studentId) query.studentId = studentId
    
    const payments = await FeePayment.find(query)
      .populate('studentId')
      .populate('courseId')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    
    const receiptNumber = `RCP${Date.now()}`
    const payment = await FeePayment.create({ ...data, receiptNumber })
    await payment.populate(['studentId', 'courseId'])
    
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}
