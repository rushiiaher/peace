import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { currentPassword, newPassword } = await req.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }
    
    const user = await User.findById(params.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    
    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 500 })
  }
}
