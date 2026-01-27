import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

import { getEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const JWT_SECRET = getEnv('JWT_SECRET')

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const dbStart = Date.now()
    await connectDB()
    console.log(`DB connected in ${Date.now() - dbStart}ms`)
    
    const { email, password } = await req.json()

    const queryStart = Date.now()
    const user = await User.findOne({ email }).select('+password +role +courses').lean()
    console.log(`User query in ${Date.now() - queryStart}ms`)

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.role === 'student' && user.courses?.some((c: any) => c.status === 'Active' && !c.royaltyPaid)) {
      return NextResponse.json({ error: 'Your fees have not been paid to the Super Admin. Please contact your Institute Admin.' }, { status: 403 })
    }

    const sessionToken = crypto.randomUUID()

    await User.findByIdAndUpdate(user._id, {
      lastActiveAt: new Date(),
      lastLogin: new Date(),
      sessionToken
    }, { lean: true })

    const tokenPayload: any = {
      userId: user._id,
      email: user.email,
      role: user.role,
      instituteId: user.instituteId
    }

    if (user.role !== 'super-admin') {
      tokenPayload.sessionToken = sessionToken
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })

    console.log(`Total login time: ${Date.now() - startTime}ms`)
    
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        instituteId: user.instituteId,
        rollNo: user.rollNo,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName
      }
    })
  } catch (error: any) {
    console.error('Login error:', error?.message || error)
    return NextResponse.json({ 
      error: 'Login failed', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
