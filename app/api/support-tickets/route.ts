import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SupportTicket from '@/lib/models/SupportTicket'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    
    const query: any = {}
    if (userId) query.userId = userId
    if (userRole) query.userRole = userRole
    
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .populate('instituteId', 'name')
      .populate('replies.userId', 'name')
      .sort({ updatedAt: -1 })
    
    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const ticket = await SupportTicket.create(data)
    await ticket.populate(['userId', 'instituteId'])
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
