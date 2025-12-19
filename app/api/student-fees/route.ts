import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StudentFee from '@/lib/models/StudentFee'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const instituteId = searchParams.get('instituteId')
    
    let query: any = {}
    if (studentId) query.studentId = studentId
    if (instituteId) query.instituteId = instituteId
    
    const fees = await StudentFee.find(query)
      .populate('studentId', 'name rollNo email')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(fees)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch fees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const fee = await StudentFee.create(data)
    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create fee' }, { status: 500 })
  }
}
