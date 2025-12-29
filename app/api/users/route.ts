import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import '@/lib/models/Course' // Ensure Course model is registered
import Batch from '@/lib/models/Batch'
import Institute from '@/lib/models/Institute'

export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const instituteId = searchParams.get('instituteId')
    const role = searchParams.get('role')

    const courseId = searchParams.get('courseId')
    const requireRoyalty = searchParams.get('royaltyPaid') === 'true'
    const batchId = searchParams.get('batchId')

    const query: any = {}
    if (instituteId) query.instituteId = instituteId
    if (role) query.role = role

    if (batchId) {
      const batch = await Batch.findById(batchId).select('students').lean() as any
      if (batch && batch.students) {
        query._id = { $in: batch.students }
      } else {
        return NextResponse.json([])
      }
    }

    if (courseId) {
      if (requireRoyalty) {
        query.courses = {
          $elemMatch: {
            courseId: courseId,
            royaltyPaid: true
          }
        }
      } else {
        query['courses.courseId'] = courseId
      }
    } else if (requireRoyalty) {
      query['courses.royaltyPaid'] = true
    }

    const limit = parseInt(searchParams.get('limit') || '50')

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    await User.populate(users, { path: 'courses.courseId' })

    // augment with fee status if fetching students for an institute
    if (instituteId && role === 'student') {
      const FeePayment = (await import('@/lib/models/FeePayment')).default
      const studentIds = users.map((u: any) => u._id)

      const feeRecords = await FeePayment.find({
        instituteId,
        studentId: { $in: studentIds }
      }).lean()

      const feeMap: any = {}

      // Group by Student
      feeRecords.forEach((rec: any) => {
        const sid = rec.studentId.toString()
        if (!feeMap[sid]) feeMap[sid] = []
        feeMap[sid].push(rec)
      })

      // Process each student
      users.forEach((user: any) => {
        const records = feeMap[user._id.toString()] || []

        // Calculate total paid across all courses
        const totalPaid = records.reduce((sum: number, r: any) => sum + (r.paidAmount || 0), 0)

        // Check Fully Paid Status
        // Logic: For every enrolled course, is there a latest fee record with dueAmount <= 0?
        let isFullyPaid = false

        if (user.courses && user.courses.length > 0) {
          const enrolledCourseIds = user.courses.map((c: any) => c.courseId?._id?.toString() || c.courseId?.toString())

          // Group records by Course
          const coursesStatus = enrolledCourseIds.map((cid: string) => {
            const courseRecords = records.filter((r: any) => r.courseId.toString() === cid)
            if (courseRecords.length === 0) return false // No record = Not paid

            // Get latest
            courseRecords.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            return courseRecords[0].dueAmount <= 0
          })

          isFullyPaid = coursesStatus.length > 0 && coursesStatus.every((status: boolean) => status === true)
        }

        user.studentPaidAmount = totalPaid
        user.studentFullyPaid = isFullyPaid
      })
    }

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    // Check for duplicate email
    if (data.email) {
      const existingUser = await User.findOne({ email: data.email }).select('_id').lean()
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists. Please use a different email.' }, { status: 400 })
      }
    }

    // Construct full name if parts are provided
    if (data.firstName || data.lastName) {
      const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean)
      if (parts.length > 0) {
        data.name = parts.join(' ')
      }
    }

    // Auto-generate Roll No for Students
    if (data.role === 'student' && data.instituteId && !data.rollNo) {
      const institute = await Institute.findById(data.instituteId).lean()
      if (institute && institute.code) {
        // Logic: [INST_CODE][SEQUENCE_NUMBER] (e.g. VIS0001)
        const prefix = institute.code

        // Find last student created for this institute with this prefix
        const lastStudent = await User.findOne({
          instituteId: data.instituteId,
          role: 'student',
          rollNo: { $regex: new RegExp(`^${prefix}`, 'i') }
        }).sort({ createdAt: -1 }).select('rollNo').lean()

        let nextSeq = 1
        if (lastStudent && lastStudent.rollNo) {
          const rollNoStr = lastStudent.rollNo.toString()
          const numericPart = rollNoStr.replace(new RegExp(`^${prefix}`, 'i'), '')
          const lastSeq = parseInt(numericPart, 10)
          if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1
          }
        }

        data.rollNo = `${prefix}${nextSeq.toString().padStart(4, '0')}`
      } else {
        // Fallback
        if (!data.rollNo) data.rollNo = `ST-${Date.now().toString().slice(-6)}`
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = await User.create({ ...data, password: hashedPassword })
    const { password, ...userWithoutPassword } = user.toObject()
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}
