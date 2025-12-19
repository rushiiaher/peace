import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Ticket from '@/lib/models/Ticket'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    data.updatedAt = new Date()
    const ticket = await Ticket.findByIdAndUpdate(params.id, data, { new: true })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const ticket = await Ticket.findByIdAndDelete(params.id)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    return NextResponse.json({ message: 'Ticket deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
