import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeePayment from '@/lib/models/FeePayment'
import mongoose from 'mongoose'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    try {
        await connectDB()
        const instituteId = params.id
        const { searchParams } = new URL(req.url)
        const months = Number(searchParams.get('months')) || 6

        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)
        startDate.setDate(1) // Start from 1st of that month

        const stats = await FeePayment.aggregate([
            {
                $match: {
                    instituteId: new mongoose.Types.ObjectId(instituteId),
                    paymentDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$paymentDate" },
                        year: { $year: "$paymentDate" }
                    },
                    total: { $sum: "$paidAmount" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ])

        // Format for Chart (fill missing months)
        const result = []
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        let currentDate = new Date(startDate)
        const now = new Date()

        while (currentDate <= now) {
            const m = currentDate.getMonth() + 1
            const y = currentDate.getFullYear()

            const found = stats.find(s => s._id.month === m && s._id.year === y)

            result.push({
                label: monthNames[m - 1],
                value: found ? found.total : 0,
                fullDate: new Date(currentDate) // Optional, for debugging
            })

            currentDate.setMonth(currentDate.getMonth() + 1)
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Revenue stats error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch revenue stats' }, { status: 500 })
    }
}
