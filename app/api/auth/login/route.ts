import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check Royalty Status for Students
    if (user.role === 'student' && user.courses && user.courses.length > 0) {
      // Strict Policy: If ANY active course has unpaid royalty, block access.
      const hasUnpaidRoyalty = user.courses.some((c: any) => c.status === 'Active' && !c.royaltyPaid)

      if (hasUnpaidRoyalty) {
        return NextResponse.json({ error: 'Your fees have not been paid to the Super Admin. Please contact your Institute Admin.' }, { status: 403 })
      }
    }

    // Single Session Enforcement
    // If active within last 2 minutes, block login
    const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000)
    if (user.lastActiveAt && user.lastActiveAt > TWO_MINUTES_AGO) {
      return NextResponse.json({ error: 'User is currently logged in on another device. Please try again later or wait for session to timeout.' }, { status: 403 })
    }

    // Update lastActiveAt
    await User.findByIdAndUpdate(user._id, {
      lastActiveAt: new Date(),
      lastLogin: new Date()
    })

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, instituteId: user.instituteId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        instituteId: user.instituteId
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
