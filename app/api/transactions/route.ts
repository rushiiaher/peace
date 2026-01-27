import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const instituteId = searchParams.get('instituteId')
    
    let query: any = {}
    if (type) query.type = type
    if (instituteId) query.instituteId = instituteId
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }
    
    const transactions = await Transaction.find(query)
      .populate('instituteId', 'name')
      .sort({ date: -1 })
    
    return NextResponse.json(transactions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const transaction = await Transaction.create(data)
    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
