import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Institute from '@/lib/models/Institute'
import Batch from '@/lib/models/Batch'
import Course from '@/lib/models/Course'

export async function POST(req: Request) {
    try {
        await connectDB()
        const { instituteId, studentId, courseId } = await req.json()

        if (!instituteId || !studentId || !courseId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch Student & Course Details
        const user = await User.findById(studentId)
        if (!user) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

        const enrollment = user.courses.find((c: any) => c.courseId.toString() === courseId)
        if (!enrollment) return NextResponse.json({ error: 'Student not enrolled in this course' }, { status: 404 })

        const course = await Course.findById(courseId)
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

        // 2. Fetch Batch
        const batch = await Batch.findOne({
            students: studentId,
            courseId: courseId,
            instituteId: instituteId
        })

        // 3. Calculate Components
        const examFee = course.examFee || 0
        const certCharge = course.certificateCharge || 0
        const bookPrice = course.bookPrice || 0
        const deliveryCharge = course.deliveryCharge || 0

        // Base Royalty (Exam + Cert)
        let totalRoyalty = examFee + certCharge

        // Add Book Price if books included
        if (enrollment.booksIncluded) {
            totalRoyalty += bookPrice
        }

        // Add Delivery Charge if NOT paid for this batch yet
        let deliveryCharged = false
        if (batch && !batch.isDeliveryPaid) {
            totalRoyalty += deliveryCharge
            deliveryCharged = true
        } else if (!batch) {
            // Fallback: If for some reason student is not in a batch (unexpected), maybe charge delivery?
            // But requirement says "Per batch". Safe to skip if no batch context or charge once per student?
            // Let's assume batch existence is mandatory for this logic or skip delivery charge.
            // Skipping for now to avoid overcharging.
        }

        // 4. Update Student Record
        const updatedUser = await User.findOneAndUpdate(
            { _id: studentId, 'courses.courseId': courseId },
            {
                $set: {
                    'courses.$.royaltyPaid': true,
                    'courses.$.royaltyAmount': totalRoyalty,
                    'courses.$.royaltyPaidAt': new Date()
                }
            },
            { new: true }
        )

        // 5. Update Batch if delivery was charged
        if (deliveryCharged && batch) {
            batch.isDeliveryPaid = true
            await batch.save()
        }

        return NextResponse.json({
            message: 'Royalty paid successfully',
            amountPaid: totalRoyalty,
            breakdown: {
                examFee,
                certCharge,
                bookPrice: enrollment.booksIncluded ? bookPrice : 0,
                deliveryCharge: deliveryCharged ? deliveryCharge : 0
            },
            user: updatedUser
        })

    } catch (error: any) {
        console.error('Royalty Payment Error:', error)
        return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 })
    }
}
