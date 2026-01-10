import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

import { getEnv } from '@/lib/env'

const JWT_SECRET = getEnv('JWT_SECRET')

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

    // Single Session Enforcement Logic
    // We generate a unique session token for every login.
    // This invalidates any previous session for this user (unless super-admin).

    // Note: We REMOVED the "active in last 2 minutes" block. 
    // Now, logging in simply kicks the other device out.

    const sessionToken = crypto.randomUUID()

    // Update User with new session
    await User.findByIdAndUpdate(user._id, {
      lastActiveAt: new Date(),
      lastLogin: new Date(),
      sessionToken: sessionToken
    })

    const tokenPayload: any = {
      userId: user._id,
      email: user.email,
      role: user.role,
      instituteId: user.instituteId
    }

    // Only non-super-admins exist in the single-session realm
    if (user.role !== 'super-admin') {
      tokenPayload.sessionToken = sessionToken
    }

    const token = jwt.sign(
      tokenPayload,
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
        instituteId: user.instituteId,
        rollNo: user.rollNo,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        documents: user.documents // Include documents field with photo
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
