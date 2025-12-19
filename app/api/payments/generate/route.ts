import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import Payment from '@/lib/models/Payment'

export async function POST(req: Request) {
  try {
    await connectDB()

    const students = await User.find({ role: 'student', 'courses.0': { $exists: true } })
    let created = 0

    for (const student of students) {
      for (const enrollment of student.courses) {
        const existingPayment = await Payment.findOne({
          studentId: student._id,
          courseId: enrollment.courseId
        })

        if (!existingPayment) {
          const course = await Course.findById(enrollment.courseId)
          if (course && student.instituteId) {
            const certificateCharge = course.certificateCharge || 60
            const totalAmount = course.baseFee + course.examFee + certificateCharge +
              (enrollment.booksIncluded ? course.bookPrice + course.deliveryCharge : 0)

            await Payment.create({
              instituteId: student.instituteId,
              studentId: student._id,
              courseId: enrollment.courseId,
              baseFee: course.baseFee,
              examFee: course.examFee,
              bookPrice: enrollment.booksIncluded ? course.bookPrice : 0,
              deliveryCharge: enrollment.booksIncluded ? course.deliveryCharge : 0,
              certificateCharge,
              totalAmount,
              status: 'Pending'
            })
            created++
          }
        }
      }
    }

    return NextResponse.json({ message: `Generated ${created} payment records` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate payments' }, { status: 500 })
  }
}
