import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Institute from '@/lib/models/Institute'
import Payment from '@/lib/models/Payment'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    let query: any = {}

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      query.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { code: searchRegex }
      ]
    }

    const institutes = await Institute.find(query)
      .populate('courses.courseId')
      .sort({ createdAt: -1 })

    // Optimized: Calculate pending payments in ONE query
    const instituteIds = institutes.map((i: any) => i._id)

    const pendingStats = await Payment.aggregate([
      {
        $match: {
          instituteId: { $in: instituteIds },
          status: 'Pending'
        }
      },
      {
        $group: {
          _id: '$instituteId',
          total: { $sum: '$totalAmount' }
        }
      }
    ])

    // Create lookup map for O(1) access
    const paymentMap = pendingStats.reduce((acc: any, curr: any) => {
      acc[curr._id.toString()] = curr.total
      return acc
    }, {})

    // Map results
    const institutesWithPayment = institutes.map((inst: any) => ({
      ...inst.toObject(),
      pendingPayment: paymentMap[inst._id.toString()] || 0
    }))

    return NextResponse.json(institutesWithPayment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch institutes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const institute = await Institute.create(data)
    return NextResponse.json(institute, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create institute' }, { status: 500 })
  }
}
