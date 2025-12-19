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

export async function GET() {
  try {
    await connectDB()

    const [institutes, students, courses, payments, transactions, exams, examResults, supportTickets] = await Promise.all([
      Institute.find({ status: 'Active' }),
      User.find({ role: 'student', status: 'Active' }),
      Course.find(),
      Payment.find(),
      Transaction.find(),
      Exam.find(),
      ExamResult.find(),
      SupportTicket.find()
    ])

    const paidPayments = payments.filter(p => p.status === 'Paid')
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0)
    const pendingRevenue = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.totalAmount, 0)
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
    const avgScore = examResults.length > 0 ? Math.round(examResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / examResults.length) : 0

    const revenueTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const monthPayments = paidPayments.filter(p => {
        const paidDate = new Date(p.paidAt || p.createdAt)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      revenueTrend.push({
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: monthPayments.reduce((sum, p) => sum + p.totalAmount, 0)
      })
    }

    const enrollmentTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const count = students.filter(s => new Date(s.createdAt) <= monthEnd).length
      enrollmentTrend.push({
        month: date.toLocaleString('default', { month: 'short' }),
        students: count
      })
    }

    const instituteData = await Promise.all(
      institutes.map(async (inst) => {
        const instStudents = students.filter(s => s.instituteId?.toString() === inst._id.toString()).length
        const instPayments = paidPayments.filter(p => p.instituteId?.toString() === inst._id.toString())
        const instRevenue = instPayments.reduce((sum, p) => sum + p.totalAmount, 0)
        return { name: inst.name, students: instStudents, revenue: instRevenue, courses: inst.courses?.length || 0 }
      })
    )

    const courseData = courses.map(course => ({
      name: course.name,
      students: students.filter(s => s.courses?.some((c: any) => c.courseId?.toString() === course._id.toString())).length
    }))

    return NextResponse.json({
      overview: {
        totalInstitutes: institutes.length,
        totalStudents: students.length,
        totalCourses: courses.length,
        totalRevenue,
        pendingRevenue,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        totalDPPs: exams.filter(e => e.type === 'DPP').length,
        totalFinalExams: exams.filter(e => e.type === 'Final').length,
        avgScore,
        openTickets: supportTickets.filter(t => t.status === 'Open').length
      },
      trends: { revenue: revenueTrend, enrollment: enrollmentTrend },
      institutes: instituteData,
      courses: courseData,
      recent: {
        students: students.slice(-5).reverse(),
        payments: paidPayments.slice(-5).reverse()
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
