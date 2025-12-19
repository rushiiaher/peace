import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StudentFee from '@/lib/models/StudentFee'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    
    const fee = await StudentFee.findByIdAndUpdate(params.id, data, { new: true })
    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    
    return NextResponse.json(fee)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update fee' }, { status: 500 })
  }
}
