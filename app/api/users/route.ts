import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const users = await User.find()
      .populate('instituteId', 'name code location')
      .select('-password')
      .sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([], { status: 200 })
  }
}