import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Staff from '@/lib/models/Staff'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const staff = await Staff.findById(params.id)
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Staff fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    const staff = await Staff.findByIdAndUpdate(params.id, data, { new: true })
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Staff update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const staff = await Staff.findByIdAndDelete(params.id)
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    return NextResponse.json({ message: 'Staff deleted' })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete staff' }, { status: 500 })
  }
}
