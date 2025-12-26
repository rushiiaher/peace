import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const decoded: any = jwt.verify(token, JWT_SECRET)

        await connectDB()

        // Single Session Enforcement: Check if session token matches
        // Super Admins bypass this check
        if (decoded.role !== 'super-admin') {
            const user = await User.findById(decoded.userId).select('sessionToken')
            // If user has a sessionToken in DB but it doesn't match ours, we are stale.
            // If user has NO sessionToken in DB (legacy/first time), we might be lenient or strict.
            // Given "Force Login" intent, typically DB always has the latest.
            if (!user || (user.sessionToken && user.sessionToken !== decoded.sessionToken)) {
                return NextResponse.json({ error: 'Session expired. You are logged in on another device.' }, { status: 401 })
            }
        }

        // Update lastActiveAt
        await User.findByIdAndUpdate(decoded.userId, { lastActiveAt: new Date() })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
