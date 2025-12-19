import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Staff from '@/lib/models/Staff'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    
    const query = instituteId ? { instituteId } : {}
    const staff = await Staff.find(query).sort({ createdAt: -1 })
    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Staff fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const staff = await Staff.create(data)
    return NextResponse.json(staff, { status: 201 })
  } catch (error: any) {
    console.error('Staff creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create staff' }, { status: 500 })
  }
}
