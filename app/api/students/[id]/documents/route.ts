import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const formData = await req.formData()
    
    const documentType = formData.get('documentType') as string
    const file = formData.get('file') as File
    
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`
    
    const user = await User.findById(params.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    if (!user.documents) user.documents = {}
    
    if (documentType === 'photo') {
      user.documents.photo = dataUrl
    } else if (documentType === 'idProof') {
      user.documents.idProof = dataUrl
      const idProofType = formData.get('idProofType') as string
      if (idProofType) user.documents.idProofType = idProofType
    } else if (documentType === 'certificate') {
      if (!user.documents.certificates) user.documents.certificates = []
      user.documents.certificates.push(dataUrl)
    }
    
    await user.save()
    
    const updatedUser = await User.findById(params.id).select('-password')
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 })
  }
}
