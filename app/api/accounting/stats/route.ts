import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import Payment from '@/lib/models/Payment'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateQuery: any = {}
    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = new Date(startDate)
      if (endDate) dateQuery.$lte = new Date(endDate)
    }

    const query = Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {}

    const [incomeResult, expenseResult, commissionResult, feeCollectionResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$commission' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'Paid', ...(Object.keys(dateQuery).length > 0 ? { paidAt: dateQuery } : {}) } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ])

    return NextResponse.json({
      totalIncome: incomeResult[0]?.total || 0,
      totalExpense: expenseResult[0]?.total || 0,
      commissionEarned: commissionResult[0]?.total || 0,
      feeCollection: feeCollectionResult[0]?.total || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
