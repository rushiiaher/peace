import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Enquiry from '@/lib/models/Enquiry'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')

    const filter = instituteId ? { instituteId } : {}
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(enquiries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    // Construct full name if parts are provided
    if (data.firstName || data.lastName) {
      const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean)
      if (parts.length > 0) {
        data.name = parts.join(' ')
      }
    }

    const enquiry = await Enquiry.create(data)
    return NextResponse.json(enquiry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500 })
  }
}
