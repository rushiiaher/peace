import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'
import '@/lib/models/Course'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const institute = await Institute.findById(params.id)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    await Institute.populate(institute, { path: 'courses.courseId' })
    return NextResponse.json(institute)
  } catch (error: any) {
    console.error('Institute fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch institute' }, { status: 500 })
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const data = await req.json()
    const institute = await Institute.findByIdAndUpdate(params.id, data, { new: true })
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    await Institute.populate(institute, { path: 'courses.courseId' })
    return NextResponse.json(institute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update institute' }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const institute = await Institute.findByIdAndDelete(params.id)
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })
    return NextResponse.json({ message: 'Institute deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete institute' }, { status: 500 })
  }
}
