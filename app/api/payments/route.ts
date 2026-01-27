import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'
import '@/lib/models/Institute' // Evaluate model registration
import '@/lib/models/User' // Evaluate model registration
import '@/lib/models/Course' // Evaluate model registration
import FeePayment from '@/lib/models/FeePayment'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const studentId = searchParams.get('studentId')

    let query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (studentId) query.studentId = studentId

    const payments = await Payment.find(query)
      .populate('instituteId', 'name status')
      .populate('studentId', 'name rollNo email phone documents')
      .populate('courseId', 'name code deliveryCharge')
      .lean()
      .sort({ createdAt: -1 })

    // Check student fee status (Student -> Institute)
    if (instituteId) {


      const validPayments = payments.filter((p: any) => p.studentId && p.courseId)
      const studentIds = validPayments.map((p: any) => p.studentId._id)

      const feeRecords = await FeePayment.find({
        instituteId,
        studentId: { $in: studentIds }
      }).lean()

      // Map fee status
      const feeStatusMap: any = {}

      // Group records by student-course to process latest/totals
      const byStudentCourse: any = {}
      feeRecords.forEach((rec: any) => {
        const key = `${rec.studentId}-${rec.courseId}`
        if (!byStudentCourse[key]) byStudentCourse[key] = []
        byStudentCourse[key].push(rec)
      })

      // Process each group
      Object.keys(byStudentCourse).forEach(key => {
        const records = byStudentCourse[key]
        // Sort by createdAt desc to get latest status
        records.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const totalPaid = records.reduce((sum: number, r: any) => sum + (r.paidAmount || 0), 0)
        const latest = records[0]
        // If latest record says 0 due, assume fully paid.
        const isFullyPaid = latest ? latest.dueAmount <= 0 : false

        feeStatusMap[key] = { paid: totalPaid, full: isFullyPaid }
      })

      // Augment payments
      const augmented = payments.map((p: any) => {
        if (!p.studentId || !p.courseId) return p // Return as is if data missing

        const key = `${p.studentId._id}-${p.courseId._id}`
        const status = feeStatusMap[key]
        return {
          ...p,
          studentPaidAmount: status ? status.paid : 0,
          studentFullyPaid: status ? status.full : false
        }
      })
      return NextResponse.json(augmented)
    }

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Payment API Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()
    const payment = await Payment.create(data)
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}
