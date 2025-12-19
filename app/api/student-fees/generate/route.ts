import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import StudentFee from '@/lib/models/StudentFee'

export async function POST(req: Request) {
  try {
    await connectDB()
    
    const students = await User.find({ role: 'student', 'courses.0': { $exists: true } })
    let created = 0
    
    for (const student of students) {
      for (const enrollment of student.courses) {
        const existingFee = await StudentFee.findOne({ 
          studentId: student._id, 
          courseId: enrollment.courseId 
        })
        
        if (!existingFee) {
          const course = await Course.findById(enrollment.courseId)
          if (course && student.instituteId) {
            const totalFee = course.baseFee + course.examFee + 
              (enrollment.booksIncluded ? course.bookPrice + course.deliveryCharge : 0)
            
            await StudentFee.create({
              studentId: student._id,
              instituteId: student.instituteId,
              courseId: enrollment.courseId,
              totalFee,
              paidAmount: 0,
              pendingAmount: totalFee,
              installments: [],
              status: 'Pending'
            })
            created++
          }
        }
      }
    }
    
    return NextResponse.json({ message: `Generated ${created} student fee records` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate fees' }, { status: 500 })
  }
}
