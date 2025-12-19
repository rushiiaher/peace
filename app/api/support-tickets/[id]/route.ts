import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SupportTicket from '@/lib/models/SupportTicket'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    data.updatedAt = new Date()
    const ticket = await SupportTicket.findByIdAndUpdate(params.id, data, { new: true })
      .populate(['userId', 'instituteId', 'replies.userId'])
    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
