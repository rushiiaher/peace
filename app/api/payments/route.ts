import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'
import '@/lib/models/Institute' // Evaluate model registration
import '@/lib/models/User' // Evaluate model registration
import '@/lib/models/Course' // Evaluate model registration

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const studentId = searchParams.get('studentId')

    let query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (studentId) query.studentId = studentId

    const payments = await Payment.find(query)
      .populate('instituteId', 'name status')
      .populate('studentId', 'name rollNo')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Payment API Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const payment = await Payment.create(data)
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}
