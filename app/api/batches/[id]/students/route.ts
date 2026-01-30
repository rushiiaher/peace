import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import User from '@/lib/models/User'

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const { studentId, booksIncluded } = await req.json()

    const batch = await Batch.findById(params.id)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    const Course = (await import('@/lib/models/Course')).default
    const Institute = (await import('@/lib/models/Institute')).default
    const course = await Course.findById(batch.courseId)

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // 1. Add to Batch (Idempotent)
    await Batch.findByIdAndUpdate(params.id, { $addToSet: { students: studentId } })

    // 2. Add to User (Explicit Check to prevent duplicates)
    const user = await User.findById(studentId)
    if (user) {
      const alreadyEnrolled = user.courses?.some((c: any) => c.courseId.toString() === batch.courseId.toString())
      if (!alreadyEnrolled) {
        user.courses.push({
          courseId: batch.courseId,
          booksIncluded: booksIncluded || false,
          enrolledAt: new Date(),
          status: 'Active'
        })
        await user.save()
      }
    }

    // 3. Manage Payment Record
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

    // Check for existing PENDING payment to avoid duplicates
    const existingPayment = await Payment.findOne({
      studentId,
      courseId: batch.courseId,
      status: 'Pending'
    })

    if (!existingPayment) {
      await Payment.create({
        instituteId: batch.instituteId,
        studentId,
        courseId: batch.courseId,
        baseFee: course.baseFee,
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
    console.error("Enrollment Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to add student' }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await connectDB()
    const { studentId } = await req.json()

    const batch = await Batch.findById(params.id)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    // 0. Check for Completed Payment (Guard)
    const Payment = (await import('@/lib/models/Payment')).default
    const paidPayment = await Payment.findOne({
      studentId,
      courseId: batch.courseId,
      status: 'Paid'
    })

    if (paidPayment) {
      return NextResponse.json({ error: 'Cannot remove student: Payment to Super Admin is already complete.' }, { status: 400 })
    }

    // 1. Remove from Batch
    await Batch.findByIdAndUpdate(params.id, { $pull: { students: studentId } })

    // 2. Remove from User (Explicit Filter)
    const user = await User.findById(studentId)
    if (user && user.courses) {
      user.courses = user.courses.filter((c: any) => c.courseId.toString() !== batch.courseId.toString())
      await user.save()
    }

    // 3. Remove/Void Pending Payment for this course (Clean up)
    // Clean up both Pending and Failed attempts
    await Payment.deleteMany({
      studentId,
      courseId: batch.courseId,
      status: { $in: ['Pending', 'Failed'] }
    })

    const updatedBatch = await Batch.findById(params.id).populate('students')
    return NextResponse.json(updatedBatch)
  } catch (error) {
    console.error("Remove Student Error:", error)
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 })
  }
}
