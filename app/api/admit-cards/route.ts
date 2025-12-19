import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdmitCard from '@/lib/models/AdmitCard'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    
    let query: any = {}
    
    if (examId) {
      query.examId = examId
    } else if (studentId) {
      query.studentId = studentId
    } else {
      return NextResponse.json({ error: 'examId or studentId is required' }, { status: 400 })
    }
    
    const admitCards = await AdmitCard.find(query).lean()
    return NextResponse.json(admitCards)
  } catch (error: any) {
    console.error('Admit cards fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch admit cards' }, { status: 500 })
  }
}