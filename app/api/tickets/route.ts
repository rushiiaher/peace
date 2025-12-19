import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Ticket from '@/lib/models/Ticket'

export async function GET() {
  try {
    await connectDB()
    const tickets = await Ticket.find()
      .populate('instituteId', 'name')
      .sort({ createdAt: -1 })
    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const ticket = await Ticket.create(data)
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
