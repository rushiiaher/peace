import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmsdb'

// --- Extended Schemas ---

const UserSchema = new mongoose.Schema({
  name: String, firstName: String, middleName: String, lastName: String,
  email: String, password: String, role: String,
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  rollNo: String, phone: String, address: String,
  dateOfBirth: Date, guardianName: String, guardianPhone: String,
  motherName: String, aadhaarCardNo: String,
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    booksIncluded: Boolean, enrolledAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Active' },
    royaltyPaid: { type: Boolean, default: false }, royaltyPaidAt: Date, royaltyAmount: Number,
    booksDispatched: { type: Boolean, default: false }, booksReceived: { type: Boolean, default: false }
  }],
  status: { type: String, default: 'Active' }, createdAt: { type: Date, default: Date.now },
  lastLogin: Date, lastActiveAt: Date
})

const InstituteSchema = new mongoose.Schema({
  name: String, code: String, location: String, email: String, phone: String, address: String,
  status: { type: String, default: 'Active' }, pendingPayment: { type: Number, default: 0 },
  systems: [{ name: String, status: { type: String, default: 'Available' } }],
  examTimings: { openingTime: String, closingTime: String, sectionDuration: Number, breakBetweenSections: Number, workingDays: [Number] },
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    startDate: Date, endDate: Date, enrollmentActive: Boolean, institutePrice: Number
  }],
  createdAt: { type: Date, default: Date.now }
})

const CourseSchema = new mongoose.Schema({
  name: String, code: String, category: String, about: String, syllabus: String, description: String, duration: String,
  finalExamCount: { type: Number, default: 1 }, baseFee: Number, examFee: Number, bookPrice: Number, deliveryCharge: Number, certificateCharge: Number,
  evaluationComponents: [{ name: String, maxMarks: Number }], createdAt: { type: Date, default: Date.now }
})

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true }, courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date, endDate: Date, status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }, createdAt: { type: Date, default: Date.now }
})

const FinalResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }, instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  evaluationMarks: [{ name: String, marksObtained: Number, maxMarks: Number }],
  onlineExamScore: Number, totalScore: Number, totalMaxMarks: Number, percentage: Number,
  status: { type: String, default: 'Pending' }, submittedToSuperAdmin: Boolean, submittedAt: Date,
  certificateDispatched: Boolean, certificateDispatchedAt: Date, certificateReceived: Boolean, certificateReceivedAt: Date,
  createdAt: { type: Date, default: Date.now }
})

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Income', 'Expense'] }, category: String, description: String, amount: Number,
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' }, paymentId: mongoose.Schema.Types.ObjectId,
  commission: { type: Number, default: 0 }, mode: String, date: Date, createdAt: { type: Date, default: Date.now }
})

const FeePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  totalAmount: Number, paidAmount: Number, dueAmount: Number,
  paymentMode: String, receiptNumber: String, paymentDate: Date, remarks: String,
  createdAt: { type: Date, default: Date.now }
})

const PaymentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  baseFee: { type: Number, required: true },
  examFee: { type: Number, required: true },
  bookPrice: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  certificateCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String },
  transactionId: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

const StaffSchema = new mongoose.Schema({
  name: String, email: String, phone: String, role: String, department: String, instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  salary: Number, joiningDate: Date, address: String, qualification: String, experience: Number, status: String, createdAt: { type: Date, default: Date.now }
})

const EnquirySchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' }, name: String, firstName: String, lastName: String,
  email: String, phone: String, courseInterested: String, status: String, notes: String, handledBy: mongoose.Schema.Types.ObjectId, source: String,
  address: String, createdAt: { type: Date, default: Date.now }
})

const ExamSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  type: String, title: String, date: Date, startTime: String, endTime: String, duration: Number, totalMarks: Number, totalQuestions: Number,
  questions: [Object], systemAssignments: [Object], sections: [Object], attendanceEnabled: Boolean, status: String, createdAt: { type: Date, default: Date.now }
})

const ExamResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number, totalMarks: Number, percentage: Number, answers: [Number], timeTaken: Number, submittedAt: Date
})

const AdmitCardSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNo: String, studentName: String, courseName: String, examTitle: String, examDate: Date, startTime: String, endTime: String,
  duration: Number, systemName: String, instituteName: String, sectionNumber: Number, isRescheduled: Boolean, generatedAt: { type: Date, default: Date.now }
})

const FeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, studentName: String, instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, rating: Number, feedback: String, createdAt: { type: Date, default: Date.now }
})

const QuestionBankSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, topic: String, hasDPP: Boolean, questions: [Object], createdAt: Date
})

// --- Models ---
const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema)
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema)
const FinalResult = mongoose.models.FinalResult || mongoose.model('FinalResult', FinalResultSchema)
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
const Staff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema)
const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema)
const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema)
const ExamResult = mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema)
const AdmitCard = mongoose.models.AdmitCard || mongoose.model('AdmitCard', AdmitCardSchema)
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema)
const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', QuestionBankSchema)
const FeePayment = mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema)
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)


async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')
  await Promise.all([
    User.deleteMany({}), Institute.deleteMany({}), Course.deleteMany({}), Batch.deleteMany({}),
    FinalResult.deleteMany({}), Transaction.deleteMany({}), Staff.deleteMany({}), Enquiry.deleteMany({}),
    Exam.deleteMany({}), ExamResult.deleteMany({}), AdmitCard.deleteMany({}), Feedback.deleteMany({}),
    QuestionBank.deleteMany({}), FeePayment.deleteMany({}), Payment.deleteMany({})
  ])
  console.log('✅ Database cleared')
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('📦 Connected to MongoDB')
    await clearDatabase()

    // 1. Super Admin
    console.log('👑 Creating Super Admin...')
    const hashedAdminPass = await bcrypt.hash('admin123', 10)
    await User.create({
      name: 'Super Admin',
      email: 'admin@lms.com',
      password: hashedAdminPass,
      role: 'super-admin',
      status: 'Active'
    })

    // 2. Courses
    console.log('📚 Creating Courses...')
    const courses = await Course.insertMany([
      {
        name: 'Full Stack Web Development', code: 'FSWD101', category: 'Programming', duration: '6 months',
        description: 'Master MERN Stack with Real-world projects',
        baseFee: 25000, examFee: 2000, bookPrice: 1500, deliveryCharge: 300, certificateCharge: 200,
        evaluationComponents: [{ name: 'VIVA', maxMarks: 50 }, { name: 'PRACTICAL', maxMarks: 100 }, { name: 'PROJECT', maxMarks: 100 }]
      },
      {
        name: 'Data Science Fundamentals', code: 'DS201', category: 'Data Science', duration: '4 months',
        description: 'Python, ML, and Data Analysis',
        baseFee: 20000, examFee: 1500, bookPrice: 1000, deliveryCharge: 200, certificateCharge: 150,
        evaluationComponents: [{ name: 'VIVA', maxMarks: 50 }, { name: 'PRACTICAL', maxMarks: 50 }]
      },
      {
        name: 'Digital Marketing Pro', code: 'DM301', category: 'Marketing', duration: '3 months',
        description: 'SEO, SEM, and Social Media Marketing',
        baseFee: 15000, examFee: 1000, bookPrice: 800, deliveryCharge: 150, certificateCharge: 100,
        evaluationComponents: [{ name: 'STRATEGY', maxMarks: 100 }, { name: 'VIVA', maxMarks: 50 }]
      }
    ])

    // Question Banks
    console.log('❓ Creating Question Banks...')
    for (const c of courses) {
      await QuestionBank.create({
        courseId: c._id,
        topic: 'General Knowledge',
        hasDPP: true,
        questions: Array.from({ length: 20 }, (_, i) => ({
          id: i, question: `Sample Question ${i + 1} for ${c.code}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 0, marks: 2
        }))
      })
    }

    // 3. Institute
    console.log('🏢 Creating Tech Institute...')
    const institute = await Institute.create({
      name: 'Tech Institute Mumbai', code: 'TIM001', location: 'Mumbai', email: 'admin@techmumbai.edu', phone: '9876543210', address: 'Andheri East, Mumbai',
      systems: Array.from({ length: 20 }, (_, i) => ({ name: `SYS-${i + 1}`, status: 'Available' })),
      examTimings: { openingTime: '09:00', closingTime: '18:00', sectionDuration: 180, breakBetweenSections: 30, workingDays: [1, 2, 3, 4, 5, 6] },
      courses: courses.map(c => ({
        courseId: c._id, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), enrollmentActive: true, institutePrice: (c.baseFee || 0) + 5000
      }))
    })

    // 4. Institute Admin
    console.log('👤 Creating Institute Admin...')
    const adminUser = await User.create({
      name: 'Rajesh Server', email: 'rajesh@techmumbai.edu', password: hashedAdminPass, role: 'institute-admin', instituteId: institute._id
    })

    // 5. Staff
    console.log('👥 Creating Staff...')
    const staffMembers = await Staff.insertMany([
      { name: 'Amit Kumar', email: 'amit@techmumbai.edu', role: 'Faculty', department: 'Programming', instituteId: institute._id, salary: 50000, joiningDate: new Date('2024-01-01'), status: 'Active' },
      { name: 'Sarah Lee', email: 'sarah@techmumbai.edu', role: 'Faculty', department: 'Data Science', instituteId: institute._id, salary: 55000, joiningDate: new Date('2024-02-01'), status: 'Active' },
      { name: 'John Doe', email: 'john@techmumbai.edu', role: 'Admin Staff', department: 'Operations', instituteId: institute._id, salary: 30000, joiningDate: new Date('2024-01-15'), status: 'Active' }
    ])

    // 6. Enquiries
    console.log('📞 Creating Enquiries...')
    const enquiryStatuses = ['New', 'Contacted', 'Converted', 'Lost']
    for (let i = 1; i <= 20; i++) {
      const randStatus = enquiryStatuses[Math.floor(Math.random() * enquiryStatuses.length)]
      await Enquiry.create({
        instituteId: institute._id,
        name: `Enquiry User ${i}`,
        firstName: `Enquiry`, lastName: `User ${i}`,
        email: `enq${i}@test.com`,
        phone: `99887766${String(i).padStart(2, '0')}`,
        courseInterested: courses[i % courses.length].name,
        status: randStatus,
        handledBy: i % 2 === 0 ? adminUser._id : undefined, // Some handled by admin
        source: 'Website',
        address: 'Mumbai',
        notes: 'Interested in weekend batch'
      })
    }

    // 7. Batches & Students
    console.log('📦 Creating Batches & Students...')
    const studentPass = await bcrypt.hash('student123', 10)

    // Create 3 batches per course: Completed, Active, Upcoming
    for (const course of courses) {
      const batchTypes = [
        { type: 'Completed', suffix: 'Oct 2024', start: new Date('2024-10-01'), end: new Date('2025-03-01') },
        { type: 'Completed', suffix: 'June 2024', start: new Date('2024-06-01'), end: new Date('2024-12-01') },
        { type: 'Active', suffix: 'Jan 2025', start: new Date('2025-01-01'), end: new Date('2025-06-01') },
        { type: 'Upcoming', suffix: 'June 2025', start: new Date('2025-06-01'), end: new Date('2025-12-01') }
      ]

      for (const bType of batchTypes) {
        const batch = await Batch.create({
          name: `${course.code} - ${bType.suffix}`,
          courseId: course._id,
          instituteId: institute._id,
          startDate: bType.start,
          endDate: bType.end,
          status: bType.type === 'Upcoming' ? 'Inactive' : 'Active',
          students: []
        })

        // Only populate students for Completed and Active
        if (bType.type !== 'Upcoming') {
          const studentCount = 5
          for (let i = 1; i <= studentCount; i++) {
            const isCompleted = bType.type === 'Completed'
            const royaltyPaid = isCompleted || i <= 3 // All completed paid, Active: 3/5 paid

            // FIXED: Unique email using batch suffix + i
            const batchTag = bType.suffix.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4) // e.g. Oct2
            const firstName = `Student${course.code}${bType.type.substr(0, 1)}`
            const lastName = `${batchTag}-${i}`

            const student = await User.create({
              name: `${firstName} ${lastName}`,
              firstName, lastName,
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`,
              password: studentPass,
              role: 'student',
              instituteId: institute._id,
              rollNo: `${institute.code}-${course.code}-${batchTag}-${i}`,
              phone: `9${String(i).padStart(9, '0')}`,
              address: 'Mumbai, India',
              dob: new Date('2000-01-01'),
              motherName: `Mother ${lastName}`,
              aadhaarCardNo: `112233${course.code.replace(/\D/g, '')}${String(i).padStart(4, '0')}`,
              courses: [{
                courseId: course._id,
                booksIncluded: true,
                enrolledAt: bType.start, // Fix: use start date
                status: isCompleted ? 'Completed' : 'Active',
                royaltyPaid: royaltyPaid,
                royaltyPaidAt: royaltyPaid ? bType.start : undefined,
                royaltyAmount: royaltyPaid ? (course.examFee || 0) + (course.certificateCharge || 0) : 0, // Fix type assert
                booksDispatched: royaltyPaid,
                booksReceived: isCompleted
              }]
            })

            await Batch.findByIdAndUpdate(batch._id, { $push: { students: student._id } })

            // Fees Transaction (Income)
            const totalFee = (course.baseFee || 0) + 5000
            const paidAmount = isCompleted ? totalFee : (i % 2 === 0 ? totalFee : totalFee / 2)

            if (paidAmount > 0) {
              const receiptNo = `REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

              const payment = await FeePayment.create({
                studentId: student._id,
                instituteId: institute._id,
                courseId: course._id,
                totalAmount: totalFee,
                paidAmount: paidAmount,
                dueAmount: totalFee - paidAmount,
                paymentMode: ['Cash', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 3)],
                receiptNumber: receiptNo,
                paymentDate: bType.start,
                remarks: 'Tuition Fee Installment'
              })

              await Transaction.create({
                type: 'Income', category: 'Student Fees', description: `Fee from ${student.name}`,
                amount: paidAmount, instituteId: institute._id, date: bType.start,
                paymentId: payment._id
              })
            }

            // Royalty Payment Record (Super Admin View)
            const royaltyAmount = (course.examFee || 0) + (course.certificateCharge || 0) + (student.courses[0].booksIncluded ? (course.bookPrice || 0) : 0)

            await Payment.create({
              instituteId: institute._id,
              studentId: student._id,
              courseId: course._id,
              baseFee: course.baseFee || 0,
              examFee: course.examFee || 0,
              bookPrice: student.courses[0].booksIncluded ? (course.bookPrice || 0) : 0,
              deliveryCharge: 0,
              certificateCharge: course.certificateCharge || 0,
              totalAmount: royaltyAmount,
              status: royaltyPaid ? 'Paid' : 'Pending',
              paidAt: royaltyPaid ? bType.start : undefined,
              createdAt: bType.start
            })

            // Royalty Transaction (Expense)
            if (royaltyPaid) {
              await Transaction.create({
                type: 'Expense', category: 'Royalty Payment', description: `Royalty for ${student.name}`,
                amount: royaltyAmount, instituteId: institute._id, date: bType.start
              })
            }

            // EXAMS & RESULTS
            if (isCompleted) {
              let exam = await Exam.findOne({ title: `Final Exam - ${batch.name}` })
              if (!exam) {
                exam = await Exam.create({
                  courseId: course._id, instituteId: institute._id, type: 'Final', title: `Final Exam - ${batch.name}`,
                  date: new Date(bType.end.getTime() - 7 * 24 * 60 * 60 * 1000),
                  startTime: '10:00', endTime: '13:00', duration: 180, totalMarks: 100, totalQuestions: 50,
                  status: 'Completed', attendanceEnabled: true,
                  questions: [], systemAssignments: []
                })
              }

              const systemsAvailable = 5
              const sysNum = ((i - 1) % systemsAvailable) + 1
              const shiftNum = Math.floor((i - 1) / systemsAvailable)

              const startBaseMin = 10 * 60 // 10:00 AM
              const durationMin = 60
              const gapMin = 30

              const shiftStartMin = startBaseMin + (shiftNum * (durationMin + gapMin))
              const shiftEndMin = shiftStartMin + durationMin

              const formatTime = (min: number) => {
                const h = Math.floor(min / 60)
                const m = min % 60
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
              }

              await AdmitCard.create({
                examId: exam._id, studentId: student._id, rollNo: student.rollNo, studentName: student.name,
                courseName: course.name, examTitle: exam.title, examDate: exam.date,
                startTime: formatTime(shiftStartMin), endTime: formatTime(shiftEndMin),
                duration: durationMin, systemName: `SYS-${sysNum}`, instituteName: institute.name
              })

              const onlineScore = Math.floor(Math.random() * 80) + 20
              await ExamResult.create({
                examId: exam._id, studentId: student._id, score: onlineScore, totalMarks: 100, percentage: onlineScore,
                submittedAt: exam.date
              })

              const evalMarks = (course.evaluationComponents || []).map(comp => ({
                name: comp.name, marksObtained: Math.floor(Math.random() * (comp.maxMarks || 100)), maxMarks: comp.maxMarks
              }))
              const totalScore = evalMarks.reduce((acc, curr) => acc + curr.marksObtained, 0)
              const totalMax = evalMarks.reduce((acc, curr) => acc + (curr.maxMarks || 0), 0)

              await FinalResult.create({
                studentId: student._id, courseId: course._id, batchId: batch._id, instituteId: institute._id,
                evaluationMarks: evalMarks, onlineExamScore: onlineScore,
                totalScore, totalMaxMarks: totalMax, percentage: Math.round((totalScore / totalMax) * 100),
                status: 'Finalized', submittedToSuperAdmin: true, submittedAt: new Date(),
                certificateDispatched: true, certificateDispatchedAt: new Date(),
                certificateReceived: i % 2 === 0
              })

              await Feedback.create({
                studentId: student._id, studentName: student.name, instituteId: institute._id, courseId: course._id,
                rating: 4 + (i % 2), feedback: 'Great course, learned a lot!'
              })
            } else if (bType.type === 'Active') {
              let exam = await Exam.findOne({ title: `Final Exam - ${batch.name}` })
              if (!exam) {
                exam = await Exam.create({
                  courseId: course._id, instituteId: institute._id, type: 'Final', title: `Final Exam - ${batch.name}`,
                  date: new Date(bType.end.getTime() - 7 * 24 * 60 * 60 * 1000),
                  startTime: '10:00', endTime: '13:00', duration: 180, totalMarks: 100, status: 'Scheduled',
                  questions: []
                })
              }
            }
          }
        }
      }
    }

    console.log('✅ Seed Data Complete with Comprehensive Data!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
