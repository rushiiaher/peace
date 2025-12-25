import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Enquiry from '@/lib/models/Enquiry'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const enquiry = await Enquiry.findById(params.id)
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    return NextResponse.json(enquiry)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch enquiry' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    const enquiry = await Enquiry.findByIdAndUpdate(params.id, data, { new: true })
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    return NextResponse.json(enquiry)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const enquiry = await Enquiry.findByIdAndDelete(params.id)
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    return NextResponse.json({ message: 'Enquiry deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 })
  }
}
