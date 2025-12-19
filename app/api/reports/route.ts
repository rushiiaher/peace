import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Institute from '@/lib/models/Institute'
import Course from '@/lib/models/Course'
import Payment from '@/lib/models/Payment'
import Transaction from '@/lib/models/Transaction'
import ExamResult from '@/lib/models/ExamResult'
import Exam from '@/lib/models/Exam'

export async function GET() {
  try {
    await connectDB()

    const [
      totalStudents,
      totalInstitutes,
      totalCourses,
      paidPayments,
      transactions,
      examResults,
      exams,
      institutes
    ] = await Promise.all([
      User.countDocuments({ role: 'student', status: 'Active' }),
      Institute.countDocuments({ status: 'Active' }),
      Course.countDocuments(),
      Payment.find({ status: 'Paid' }).populate('instituteId', 'name'),
      Transaction.find(),
      ExamResult.find().populate('examId'),
      Exam.find({ type: 'Final' }),
      Institute.find({ status: 'Active' }).populate('courses.courseId', 'name')
    ])

    // Calculate revenue
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0)

    // Calculate income and expenses
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
    const netProfit = totalIncome - totalExpense

    // Calculate pass rate
    const passedExams = examResults.filter(r => (r.percentage || 0) >= 40).length
    const avgPassRate = examResults.length > 0 ? Math.round((passedExams / examResults.length) * 100) : 0

    // Enrollment trends (last 6 months)
    const enrollmentTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = await User.countDocuments({
        role: 'student',
        createdAt: { $lte: monthEnd }
      })
      
      enrollmentTrends.push({
        label: date.toLocaleString('default', { month: 'short' }),
        value: count
      })
    }

    // Revenue trends (last 6 months)
    const revenueTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthPayments = await Payment.find({
        status: 'Paid',
        paidAt: { $gte: monthStart, $lte: monthEnd }
      })
      
      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.totalAmount, 0)
      
      revenueTrends.push({
        label: date.toLocaleString('default', { month: 'short' }),
        value: monthRevenue
      })
    }

    // Institute comparison
    const instituteComparison = await Promise.all(
      institutes.map(async (inst) => {
        const instPayments = paidPayments.filter(p => p.instituteId?._id.toString() === inst._id.toString())
        const instRevenue = instPayments.reduce((sum, p) => sum + p.totalAmount, 0)
        
        const instStudents = await User.countDocuments({ 
          instituteId: inst._id, 
          role: 'student',
          status: 'Active'
        })
        
        const instExams = await Exam.find({ instituteId: inst._id, type: 'Final' })
        const instExamIds = instExams.map(e => e._id)
        const instResults = await ExamResult.find({ examId: { $in: instExamIds } })
        const instPassed = instResults.filter(r => (r.percentage || 0) >= 40).length
        const instPassRate = instResults.length > 0 ? Math.round((instPassed / instResults.length) * 100) : 0
        
        return {
          name: inst.name,
          revenue: instRevenue,
          students: instStudents,
          passRate: instPassRate
        }
      })
    )

    // Course-wise enrollment
    const courseEnrollment = await Promise.all(
      (await Course.find()).map(async (course) => {
        const count = await User.countDocuments({
          'courses.courseId': course._id,
          role: 'student',
          status: 'Active'
        })
        return {
          name: course.name,
          students: count
        }
      })
    )

    // Exam statistics
    const totalDPPs = await Exam.countDocuments({ type: 'DPP' })
    const totalFinalExams = await Exam.countDocuments({ type: 'Final' })
    const totalAttempts = examResults.length
    const avgScore = examResults.length > 0 
      ? Math.round(examResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / examResults.length)
      : 0

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalInstitutes,
        totalStudents,
        totalCourses,
        avgPassRate
      },
      financial: {
        totalIncome,
        totalExpense,
        netProfit,
        revenueTrends
      },
      enrollment: {
        trends: enrollmentTrends,
        courseWise: courseEnrollment
      },
      institutes: instituteComparison,
      exams: {
        totalDPPs,
        totalFinalExams,
        totalAttempts,
        avgScore
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
