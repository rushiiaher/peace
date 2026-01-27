import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Institute from '@/lib/models/Institute'
import Course from '@/lib/models/Course'
import Payment from '@/lib/models/Payment'
import Transaction from '@/lib/models/Transaction'
import Exam from '@/lib/models/Exam'
import ExamResult from '@/lib/models/ExamResult'
import SupportTicket from '@/lib/models/SupportTicket'

export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Vercel timeout limit

export async function GET() {
  try {
    await connectDB()

    // Use countDocuments instead of finding all for better performance
    const [
      instituteCount,
      studentCount,
      courseCount,
      examCount,
      dppCount,
      finalExamCount,
      openTicketCount
    ] = await Promise.all([
      Institute.countDocuments({ status: 'Active' }),
      User.countDocuments({ role: 'student', status: 'Active' }),
      Course.countDocuments(),
      Exam.countDocuments(),
      Exam.countDocuments({ type: 'DPP' }),
      Exam.countDocuments({ type: 'Final' }),
      SupportTicket.countDocuments({ status: 'Open' })
    ])

    // Get only aggregated payment data (much faster than loading all payments)
    const [revenueStats, recentPayments] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      Payment.find({ status: 'Paid' })
        .sort({ paidAt: -1 })
        .limit(5)
        .select('totalAmount paidAt instituteId')
        .lean()
    ])

    const totalRevenue = revenueStats.find(s => s._id === 'Paid')?.total || 0
    const pendingRevenue = revenueStats.find(s => s._id === 'Pending')?.total || 0

    // Get transaction totals using aggregation
    const [incomeStats, expenseStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ])

    const totalIncome = incomeStats[0]?.total || 0
    const totalExpense = expenseStats[0]?.total || 0

    // Get average exam score using aggregation
    const avgScoreResult = await ExamResult.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ])
    const avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0

    // Get revenue trend using aggregation (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const revenueTrendData = await Payment.aggregate([
      {
        $match: {
          status: 'Paid',
          paidAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Format revenue trend
    const revenueTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const found = revenueTrendData.find(r => r._id.month === month && r._id.year === year)
      revenueTrend.push({
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: found?.revenue || 0
      })
    }

    // Get enrollment trend using aggregation
    const enrollmentTrendData = await User.aggregate([
      {
        $match: {
          role: 'student',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Format enrollment trend with cumulative counts
    const enrollmentTrend = []
    let cumulativeCount = 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const found = enrollmentTrendData.find(r => r._id.month === month && r._id.year === year)
      cumulativeCount += found?.count || 0
      enrollmentTrend.push({
        month: date.toLocaleString('default', { month: 'short' }),
        students: cumulativeCount
      })
    }

    // Get top 10 institutes by student count
    const instituteData = await Institute.aggregate([
      { $match: { status: 'Active' } },
      {
        $lookup: {
          from: 'users',
          let: { instId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$instituteId', '$$instId'] },
                    { $eq: ['$role', 'student'] },
                    { $eq: ['$status', 'Active'] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'studentCount'
        }
      },
      {
        $lookup: {
          from: 'payments',
          let: { instId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$instituteId', '$$instId'] },
                    { $eq: ['$status', 'Paid'] }
                  ]
                }
              }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ],
          as: 'revenueData'
        }
      },
      {
        $project: {
          name: 1,
          students: { $ifNull: [{ $arrayElemAt: ['$studentCount.count', 0] }, 0] },
          revenue: { $ifNull: [{ $arrayElemAt: ['$revenueData.total', 0] }, 0] },
          courses: { $size: { $ifNull: ['$courses', []] } }
        }
      },
      { $sort: { students: -1 } },
      { $limit: 10 }
    ])

    // Get top courses by enrollment
    const courseData = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$role', 'student'] },
                    { $eq: ['$status', 'Active'] },
                    {
                      $in: ['$$courseId', {
                        $map: {
                          input: '$courses',
                          as: 'c',
                          in: '$$c.courseId'
                        }
                      }]
                    }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'studentCount'
        }
      },
      {
        $project: {
          name: 1,
          students: { $ifNull: [{ $arrayElemAt: ['$studentCount.count', 0] }, 0] }
        }
      },
      { $sort: { students: -1 } },
      { $limit: 10 }
    ])

    // Get recent students (last 5)
    const recentStudents = await User.find({ role: 'student', status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email rollNo createdAt')
      .lean()

    return NextResponse.json({
      overview: {
        totalInstitutes: instituteCount,
        totalStudents: studentCount,
        totalCourses: courseCount,
        totalRevenue,
        pendingRevenue,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        totalDPPs: dppCount,
        totalFinalExams: finalExamCount,
        avgScore,
        openTickets: openTicketCount
      },
      trends: { revenue: revenueTrend, enrollment: enrollmentTrend },
      institutes: instituteData,
      courses: courseData,
      recent: {
        students: recentStudents,
        payments: recentPayments
      }
    })
  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
