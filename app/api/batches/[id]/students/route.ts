import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import User from '@/lib/models/User'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { studentId, booksIncluded } = await req.json()

    const batch = await Batch.findById(params.id)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    const Course = (await import('@/lib/models/Course')).default
    const Institute = (await import('@/lib/models/Institute')).default
    const course = await Course.findById(batch.courseId)
    const institute = await Institute.findById(batch.instituteId)
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (!institute) return NextResponse.json({ error: 'Institute not found' }, { status: 404 })

    const courseAssignment = institute.courses.find((c: any) => c.courseId.toString() === batch.courseId.toString())
    const institutePrice = courseAssignment?.institutePrice || (course.baseFee + course.examFee)

    await Batch.findByIdAndUpdate(params.id, { $addToSet: { students: studentId } })
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { courses: { courseId: batch.courseId, booksIncluded: booksIncluded || false } }
    })

    const Payment = (await import('@/lib/models/Payment')).default

    // Check if delivery charge already applied for this batch
    const batchStudentIds = batch.students.map((s: any) => s.toString())
    const existingDeliveryPayment = await Payment.findOne({
      studentId: { $in: batchStudentIds },
      courseId: batch.courseId,
      deliveryCharge: { $gt: 0 }
    })

    const applicableDeliveryCharge = (booksIncluded && !existingDeliveryPayment) ? (course.deliveryCharge || 60) : 0
    const royaltyBase = course.examFee + (course.certificateCharge || 0)
    const totalAmount = royaltyBase + (booksIncluded ? course.bookPrice : 0) + applicableDeliveryCharge

    const existingPayment = await Payment.findOne({ studentId, courseId: batch.courseId })

    if (!existingPayment) {
      await Payment.create({
        instituteId: batch.instituteId,
        studentId,
        courseId: batch.courseId,
        baseFee: course.baseFee, // Stored for reference, not paid to super admin
        examFee: course.examFee,
        certificateCharge: course.certificateCharge || 0,
        bookPrice: booksIncluded ? course.bookPrice : 0,
        deliveryCharge: applicableDeliveryCharge,
        totalAmount,
        status: 'Pending'
      })
    }

    const updatedBatch = await Batch.findById(params.id).populate('students')
    return NextResponse.json(updatedBatch)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add student' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { studentId } = await req.json()

    const batch = await Batch.findById(params.id)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    await Batch.findByIdAndUpdate(params.id, { $pull: { students: studentId } })
    await User.findByIdAndUpdate(studentId, {
      $pull: { courses: { courseId: batch.courseId } }
    })

    const updatedBatch = await Batch.findById(params.id).populate('students')
    return NextResponse.json(updatedBatch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 })
  }
}
