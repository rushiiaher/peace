import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    await connectDB()
    const duration = Date.now() - start
    
    return NextResponse.json({ 
      status: 'ok', 
      db: 'connected',
      connectionTime: `${duration}ms`
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      db: 'failed',
      error: error?.message 
    }, { status: 500 })
  }
}
