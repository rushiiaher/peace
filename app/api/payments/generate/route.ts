import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import Payment from '@/lib/models/Payment'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await connectDB()

    const students = await User.find({ role: 'student', 'courses.0': { $exists: true } })
    let created = 0

    for (const student of students) {
      for (const enrollment of student.courses) {
        let existingPayment = await Payment.findOne({
          studentId: student._id,
          courseId: enrollment.courseId
        })

        const course = await Course.findById(enrollment.courseId)
        if (course && student.instituteId) {
          const certificateCharge = course.certificateCharge ?? 60

          // Calculate correct total: Exam + Cert + Books (if included). 
          // Base Fee is EXCLUDED. Delivery Charge is EXCLUDED (added per batch later).
          const coreAmount = course.examFee + certificateCharge +
            (enrollment.booksIncluded ? course.bookPrice : 0)

          if (!existingPayment) {
            await Payment.create({
              instituteId: student.instituteId,
              studentId: student._id,
              courseId: enrollment.courseId,
              baseFee: course.baseFee,
              examFee: course.examFee,
              bookPrice: enrollment.booksIncluded ? course.bookPrice : 0,
              deliveryCharge: 0, // Initially 0, added per batch at payment time
              certificateCharge,
              totalAmount: coreAmount,
              status: 'Pending'
            })
            created++
          } else if (existingPayment.status === 'Pending') {
            // Fix existing pending records if they differ (e.g. included base fee or auto-delivery)
            // We preserve existing deliveryCharge if it was set (assuming it might be a valid batch charge), 
            // but we ensure Base Fee is NOT in the total.
            const currentTotal = coreAmount + (existingPayment.deliveryCharge || 0)

            if (existingPayment.totalAmount !== currentTotal) {
              existingPayment.totalAmount = currentTotal
              // Update component fields to match current course stats if needed, 
              // but primarily we care about the Total and ensuring Base/Delivery logic is correct.
              // We'll update fee fields to match course just in case they changed.
              existingPayment.examFee = course.examFee
              existingPayment.certificateCharge = certificateCharge
              existingPayment.bookPrice = enrollment.booksIncluded ? course.bookPrice : 0
              // We do NOT reset deliveryCharge here to avoid clearing a manually added batch charge.

              await existingPayment.save()
            }
          }
        }
      }
    }

    return NextResponse.json({ message: `Generated ${created} payment records` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate payments' }, { status: 500 })
  }
}
