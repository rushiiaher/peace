import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmsdb'

// Models Definitions (Expanded to match actual usage and seeding requirements)

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  rollNo: String,
  phone: String,
  address: String,
  dateOfBirth: Date,
  guardianName: String,
  guardianPhone: String,
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    booksIncluded: Boolean,
    enrolledAt: { type: Date, default: Date.now } // Added for 7-day rule check
  }],
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
})

const InstituteSchema = new mongoose.Schema({
  name: String,
  code: String,
  location: String,
  email: String,
  phone: String,
  address: String,
  status: { type: String, default: 'Active' },
  pendingPayment: { type: Number, default: 0 },
  systems: [{
    name: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Occupied'], default: 'Available' }
  }],
  examTimings: {
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '18:00' },
    sectionDuration: { type: Number, default: 180 },
    breakBetweenSections: { type: Number, default: 30 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }
  },
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    startDate: Date,
    endDate: Date,
    enrollmentActive: { type: Boolean, default: true },
    institutePrice: Number
  }],
  createdAt: { type: Date, default: Date.now }
})

const CourseSchema = new mongoose.Schema({
  name: String,
  code: String,
  category: String,
  about: String,
  syllabus: String,
  description: String,
  duration: String,
  finalExamCount: { type: Number, default: 1 },
  baseFee: Number,
  examFee: Number,
  bookPrice: Number,
  deliveryCharge: Number,
  createdAt: { type: Date, default: Date.now }
})

const QuestionBankSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  topic: String,
  hasDPP: { type: Boolean, default: false },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String
  }],
  createdAt: { type: Date, default: Date.now }
})

const ExamSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  type: String,
  title: String,
  examNumber: Number,
  questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  date: Date,
  startTime: String,
  endTime: String,
  duration: Number,
  totalMarks: Number,
  totalQuestions: Number,
  questions: [{
    questionId: mongoose.Schema.Types.ObjectId,
    question: String,
    options: [String],
    correctAnswer: Number
  }],
  systemAssignments: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    systemName: String,
    attended: { type: Boolean, default: false },
    sectionNumber: { type: Number, default: 1 },
    isRescheduled: { type: Boolean, default: false },
    rescheduledReason: String
  }],
  attendanceEnabled: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
  sections: [Object], // For multi-section meta-data
  multiSection: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const ExamResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  totalMarks: Number,
  percentage: Number,
  answers: [{ type: Number }],
  timeTaken: Number,
  submittedAt: { type: Date, default: Date.now }
})

const FeedbackFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['text', 'rating', 'choice'], required: true },
    options: [String],
    required: { type: Boolean, default: true }
  }],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
})

const FeedbackResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackForm' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  responses: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String
  }],
  submittedAt: { type: Date, default: Date.now }
})

const PaymentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  baseFee: { type: Number, required: true },
  examFee: { type: Number, required: true },
  bookPrice: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: String,
  transactionId: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now }
})

const FeePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  totalAmount: Number,
  paidAmount: Number,
  dueAmount: Number,
  paymentMode: String,
  paymentDate: { type: Date, default: Date.now },
  receiptNumber: String,
  remarks: String,
  status: { type: String, default: 'Paid' }
})

const EnquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  message: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
})

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  subject: String,
  description: String,
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Open' },
  category: String,
  createdAt: { type: Date, default: Date.now }
})

const AdmitCardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  studentName: String,
  rollNo: String,
  courseName: String,
  examTitle: String,
  examDate: Date,
  startTime: String,
  endTime: String,
  duration: Number,
  systemName: String,
  instituteName: String,
  sectionNumber: { type: Number, default: 1 },
  rescheduled: { type: Boolean, default: false },
  rescheduledReason: String,
  createdAt: { type: Date, default: Date.now }
})

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  commission: { type: Number, default: 0 },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
})

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
})


const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema)
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)
const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', QuestionBankSchema)
const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema)
const ExamResult = mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema)
const FeedbackForm = mongoose.models.FeedbackForm || mongoose.model('FeedbackForm', FeedbackFormSchema)
const FeedbackResponse = mongoose.models.FeedbackResponse || mongoose.model('FeedbackResponse', FeedbackResponseSchema)
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
const FeePayment = mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema)
const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema)
const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema)
const AdmitCard = mongoose.models.AdmitCard || mongoose.model('AdmitCard', AdmitCardSchema)
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema)

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')
  // Clear ALL data
  await User.deleteMany({})
  await Institute.deleteMany({})
  await Course.deleteMany({})
  await QuestionBank.deleteMany({})
  await Exam.deleteMany({})
  await ExamResult.deleteMany({})
  await FeedbackForm.deleteMany({})
  await FeedbackResponse.deleteMany({})
  await Payment.deleteMany({})
  await FeePayment.deleteMany({})
  await Enquiry.deleteMany({})
  await SupportTicket.deleteMany({})
  await AdmitCard.deleteMany({})
  await Transaction.deleteMany({})
  await Batch.deleteMany({})
  console.log('✅ Database cleared')
}

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('📦 Connected to MongoDB')

    await clearDatabase()

    // 1. Create Super Admin (This must be present!)
    console.log('👑 Creating super admin...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await User.create({
      name: 'Super Admin',
      email: 'admin@lms.com',
      password: hashedPassword,
      role: 'super-admin',
      status: 'Active'
    })
    console.log('✅ Created Super Admin')

    // 2. Create Courses
    console.log('📚 Creating courses...')
    const courses = await Course.insertMany([
      {
        name: 'Full Stack Web Development',
        code: 'FSWD101',
        category: 'Programming',
        duration: '6 months',
        about: 'Master modern web development with React, Node.js, and databases',
        syllabus: 'HTML/CSS, JavaScript, React, Node.js, Express, MongoDB, REST APIs, Authentication, Deployment',
        description: 'Comprehensive full-stack development course covering frontend and backend technologies',
        baseFee: 25000,
        examFee: 2000,
        bookPrice: 1500,
        deliveryCharge: 200,
        finalExamCount: 2
      },
      {
        name: 'Data Science & AI',
        code: 'DSAI201',
        category: 'Data Science',
        duration: '8 months',
        about: 'Learn data analysis, machine learning, and artificial intelligence',
        syllabus: 'Python, NumPy, Pandas, Data Visualization, Machine Learning, Deep Learning, NLP, Computer Vision',
        description: 'Advanced course in data science and AI with hands-on projects',
        baseFee: 35000,
        examFee: 3000,
        bookPrice: 2000,
        deliveryCharge: 200,
        finalExamCount: 2
      },
      {
        name: 'Digital Marketing',
        code: 'DM301',
        category: 'Marketing',
        duration: '4 months',
        about: 'Master digital marketing strategies and tools',
        syllabus: 'SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing, Analytics, PPC Campaigns',
        description: 'Complete digital marketing course with practical campaigns',
        baseFee: 15000,
        examFee: 1500,
        bookPrice: 1000,
        deliveryCharge: 150,
        finalExamCount: 1
      },
      {
        name: 'Mobile App Development',
        code: 'MAD401',
        category: 'Programming',
        duration: '6 months',
        about: 'Build native and cross-platform mobile applications',
        syllabus: 'React Native, Flutter, iOS Development, Android Development, Mobile UI/UX, App Deployment',
        description: 'Comprehensive mobile app development with React Native and Flutter',
        baseFee: 28000,
        examFee: 2500,
        bookPrice: 1800,
        deliveryCharge: 200,
        finalExamCount: 2
      },
      {
        name: 'Cloud Computing & DevOps',
        code: 'CCDO501',
        category: 'Infrastructure',
        duration: '5 months',
        about: 'Master cloud platforms and DevOps practices',
        syllabus: 'AWS, Azure, Docker, Kubernetes, CI/CD, Jenkins, Terraform, Monitoring, Security',
        description: 'Learn cloud infrastructure and DevOps automation',
        baseFee: 30000,
        examFee: 2500,
        bookPrice: 1600,
        deliveryCharge: 200,
        finalExamCount: 1
      },
      {
        name: 'Cybersecurity Fundamentals',
        code: 'CS601',
        category: 'Security',
        duration: '6 months',
        about: 'Learn cybersecurity principles and ethical hacking',
        syllabus: 'Network Security, Cryptography, Ethical Hacking, Penetration Testing, Security Tools, Compliance',
        description: 'Comprehensive cybersecurity course with hands-on labs',
        baseFee: 32000,
        examFee: 2800,
        bookPrice: 1700,
        deliveryCharge: 200,
        finalExamCount: 2
      },
      {
        name: 'UI/UX Design',
        code: 'UIUX701',
        category: 'Design',
        duration: '4 months',
        about: 'Master user interface and user experience design',
        syllabus: 'Design Principles, Figma, Adobe XD, Wireframing, Prototyping, User Research, Usability Testing',
        description: 'Complete UI/UX design course with portfolio projects',
        baseFee: 18000,
        examFee: 1800,
        bookPrice: 1200,
        deliveryCharge: 150,
        finalExamCount: 1
      }
    ])
    console.log(`✅ Created ${courses.length} courses`)

    // 3. Create Institutes
    console.log('🏢 Creating institutes...')
    // Helper to calculate total SA fee
    const getSafeInstitutePrice = (course: any) => {
      const saTotal = (course.baseFee || 0) + (course.examFee || 0) + (course.bookPrice || 0) + (course.deliveryCharge || 0)
      // Institute price must be greater than SA total, adding a random margin
      return saTotal + Math.floor(Math.random() * 5000) + 2500
    }

    const institutes = await Institute.insertMany([
      {
        name: 'Tech Institute Mumbai',
        code: 'TIM001',
        location: 'Mumbai',
        email: 'admin@techmumbai.edu',
        phone: '9876543210',
        address: 'Andheri East, Mumbai',
        systems: Array.from({ length: 15 }, (_, i) => ({ name: `System-${String(i + 1).padStart(2, '0')}`, status: 'Available' })),
        examTimings: { openingTime: '09:00', closingTime: '18:00', sectionDuration: 180, breakBetweenSections: 30, workingDays: [1, 2, 3, 4, 5, 6] },
        courses: [
          {
            courseId: courses[0]._id,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-06-30'),
            institutePrice: getSafeInstitutePrice(courses[0])
          },
          {
            courseId: courses[1]._id,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-09-15'),
            institutePrice: getSafeInstitutePrice(courses[1])
          },
          {
            courseId: courses[3]._id,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-07-31'),
            institutePrice: getSafeInstitutePrice(courses[3])
          }
        ]
      },
      {
        name: 'Digital Academy Pune',
        code: 'DAP002',
        location: 'Pune',
        email: 'info@digitalpune.edu',
        phone: '9876543211',
        address: 'Hinjewadi, Pune',
        systems: Array.from({ length: 12 }, (_, i) => ({ name: `PC-${String(i + 1).padStart(2, '0')}`, status: 'Available' })),
        examTimings: { openingTime: '08:30', closingTime: '17:30', sectionDuration: 180, breakBetweenSections: 30, workingDays: [1, 2, 3, 4, 5, 6] },
        courses: [
          {
            courseId: courses[2]._id,
            startDate: new Date('2024-01-10'),
            endDate: new Date('2024-05-10'),
            institutePrice: getSafeInstitutePrice(courses[2])
          },
          {
            courseId: courses[4]._id,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-06-30'),
            institutePrice: getSafeInstitutePrice(courses[4])
          },
          {
            courseId: courses[6]._id,
            startDate: new Date('2024-01-20'),
            endDate: new Date('2024-05-20'),
            institutePrice: getSafeInstitutePrice(courses[6])
          }
        ]
      },
      {
        name: 'Cyber Institute Bangalore',
        code: 'CIB003',
        location: 'Bangalore',
        email: 'contact@cyberblr.edu',
        phone: '9876543212',
        address: 'Whitefield, Bangalore',
        systems: Array.from({ length: 8 }, (_, i) => ({ name: `LAB-${String(i + 1).padStart(2, '0')}`, status: 'Available' })),
        examTimings: { openingTime: '09:30', closingTime: '18:30', sectionDuration: 180, breakBetweenSections: 30, workingDays: [1, 2, 3, 4, 5, 6] },
        courses: [
          {
            courseId: courses[5]._id,
            startDate: new Date('2024-01-05'),
            endDate: new Date('2024-07-05'),
            institutePrice: getSafeInstitutePrice(courses[5])
          },
          {
            courseId: courses[0]._id,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-07-31'),
            institutePrice: getSafeInstitutePrice(courses[0]),
            enrollmentActive: false
          },
          {
            courseId: courses[1]._id,
            startDate: new Date('2024-01-10'),
            endDate: new Date('2024-09-10'),
            institutePrice: getSafeInstitutePrice(courses[1])
          }
        ]
      }
    ])
    console.log(`✅ Created ${institutes.length} institutes`)

    // 4. Create Institute Admins
    console.log('👤 Creating institute admins...')
    const admins = await User.insertMany([
      { name: 'Rajesh Kumar', email: 'rajesh@techmumbai.edu', password: hashedPassword, role: 'institute-admin', instituteId: institutes[0]._id },
      { name: 'Priya Sharma', email: 'priya@digitalpune.edu', password: hashedPassword, role: 'institute-admin', instituteId: institutes[1]._id },
      { name: 'Amit Patel', email: 'amit@cyberblr.edu', password: hashedPassword, role: 'institute-admin', instituteId: institutes[2]._id }
    ])
    console.log(`✅ Created ${admins.length} institute admins`)

    // 5. Create Students
    console.log('👨‍🎓 Creating students...')
    const studentPassword = await bcrypt.hash('student123', 10)
    const students = []

    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Navya', 'Angel', 'Aarohi', 'Kiara', 'Myra']
    const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Joshi', 'Mehta', 'Nair']

    let studentCount = 0
    // We'll define a base date for enrollments to ensure 7-day rule logic works later
    const baseEnrollmentDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

    for (let i = 0; i < institutes.length; i++) {
      const institute = institutes[i]
      for (let j = 0; j < institute.courses.length; j++) {
        const courseAssignment = institute.courses[j]
        const studentsPerCourse = 8 // Increased slightly

        for (let k = 0; k < studentsPerCourse; k++) {
          studentCount++
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
          const booksIncluded = Math.random() > 0.4

          // Enroll at a random time in the past (between 90 and 30 days ago)
          // This ensures if we schedule exams "soon" or "recent past", they are likely > 7 days after enrollment
          const enrollmentDate = new Date(baseEnrollmentDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000)

          students.push({
            name: `${firstName} ${lastName}`,
            email: `student${studentCount}@example.com`,
            password: studentPassword,
            role: 'student',
            instituteId: institute._id,
            rollNo: `${institute.code}-${String(studentCount).padStart(3, '0')}`,
            phone: `98765432${String(studentCount).padStart(2, '0')}`,
            address: `${institute.location}, India`,
            dateOfBirth: new Date(2000 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            guardianName: `Guardian of ${firstName}`,
            guardianPhone: `97654321${String(studentCount).padStart(2, '0')}`,
            courses: [{
              courseId: courseAssignment.courseId,
              booksIncluded,
              enrolledAt: enrollmentDate
            }],
            createdAt: enrollmentDate
          })
        }
      }
    }

    const createdStudents = await User.insertMany(students)
    console.log(`✅ Created ${createdStudents.length} students`)

    // 6. Create Batches (Linking students to batches)
    console.log('📦 Creating batches...')
    const batches = []
    const batchNames = ['Morning Batch', 'Evening Batch', 'Weekend Batch']

    for (const institute of institutes) {
      for (const courseAssignment of institute.courses) {
        const courseStudents = createdStudents.filter(s =>
          s.instituteId.toString() === institute._id.toString() &&
          s.courses.some(c => c.courseId.toString() === courseAssignment.courseId.toString())
        )

        for (let i = 0; i < 2; i++) {
          const startIdx = i === 0 ? 0 : Math.floor(courseStudents.length / 2)
          const endIdx = i === 0 ? Math.floor(courseStudents.length / 2) : courseStudents.length
          const batchStudents = courseStudents.slice(startIdx, endIdx).map(s => s._id)

          batches.push({
            name: batchNames[i],
            courseId: courseAssignment.courseId,
            instituteId: institute._id,
            students: batchStudents,
            startDate: courseAssignment.startDate,
            endDate: courseAssignment.endDate,
            status: 'Active'
          })
        }
      }
    }

    const createdBatches = await Batch.insertMany(batches)
    console.log(`✅ Created ${createdBatches.length} batches`)

    // 7. Create Question Banks
    console.log('❓ Creating question banks...')
    const questionBanks = []
    const topics = ['Basics', 'Intermediate', 'Advanced', 'Practical', 'Theory']

    for (const course of courses) {
      for (let i = 0; i < 5; i++) {
        const questions = []
        for (let j = 0; j < 50; j++) {
          questions.push({
            question: `${course.name} - ${topics[i]} - Question ${j + 1}?`,
            options: [`Option A for Q${j + 1}`, `Option B for Q${j + 1}`, `Option C for Q${j + 1}`, `Option D for Q${j + 1}`],
            correctAnswer: Math.floor(Math.random() * 4),
            explanation: `Explanation for question ${j + 1} in ${topics[i]} topic`
          })
        }
        questionBanks.push({
          courseId: course._id,
          topic: `${course.name} - ${topics[i]}`,
          questions
        })
      }
    }

    const createdQBs = await QuestionBank.insertMany(questionBanks)
    console.log(`✅ Created ${createdQBs.length} question banks`)

    // 8. Create DPPs
    console.log('📝 Creating DPPs...')
    const dpps = []
    const qbsByCourse = new Map()
    for (const qb of createdQBs) {
      const courseIdStr = qb.courseId.toString()
      if (!qbsByCourse.has(courseIdStr)) {
        qbsByCourse.set(courseIdStr, [])
      }
      qbsByCourse.get(courseIdStr).push(qb)
    }

    for (const [courseId, qbs] of qbsByCourse) {
      let dppNumber = 1
      for (const qb of qbs) {
        const selectedQuestions = qb.questions.slice(0, 20).map(q => ({
          questionId: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))

        dpps.push({
          courseId: qb.courseId,
          type: 'DPP',
          title: `DPP ${dppNumber} - ${qb.topic}`,
          examNumber: dppNumber,
          questionBankId: qb._id,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          duration: 30,
          totalMarks: 20,
          questions: selectedQuestions,
          status: 'Active'
        })
        dppNumber++
        await QuestionBank.findByIdAndUpdate(qb._id, { hasDPP: true })
      }
    }

    const createdDPPs = await Exam.insertMany(dpps)
    console.log(`✅ Created ${createdDPPs.length} DPPs`)

    // 9. Create Final Exams (AND Rescheduled Exams)
    console.log('🎓 Creating final exams & rescheduled exams...')
    const finalExams = []
    const rescheduledExamsToCreate = []

    for (const institute of institutes) {
      for (const courseAssignment of institute.courses) {
        const course = courses.find(c => c._id.toString() === courseAssignment.courseId.toString())
        const courseStudents = createdStudents.filter(s =>
          s.instituteId.toString() === institute._id.toString() &&
          s.courses.some(c => c.courseId.toString() === courseAssignment.courseId.toString())
        )

        // Schedule exam 10 days from NOW (assures 7 day rule since enrollment was >30 days ago)
        const examDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)

        const systemAssignments = courseStudents.map((student, idx) => ({
          studentId: student._id,
          systemName: institute.systems?.[idx % (institute.systems?.length || 1)]?.name || `System-${idx + 1}`,
          attended: true, // Initially assume all attend
          sectionNumber: 1,
          isRescheduled: false,
          rescheduledReason: ''
        }))

        // Pick 20% of students to be "Rescheduled" for this exam
        const rescheduleCount = Math.floor(systemAssignments.length * 0.2)
        const rescheduledStudents = []

        for (let r = 0; r < rescheduleCount; r++) {
          const sIdx = systemAssignments.length - 1 - r // Pick from end
          if (sIdx >= 0) {
            systemAssignments[sIdx].attended = false
            systemAssignments[sIdx].isRescheduled = true
            systemAssignments[sIdx].rescheduledReason = "Technical Issue"
            rescheduledStudents.push({
              ...systemAssignments[sIdx],
              sectionNumber: 999, // Convention for rescheduled
              studentId: systemAssignments[sIdx].studentId
            })
          }
        }

        const mainExam = {
          courseId: courseAssignment.courseId,
          instituteId: institute._id,
          type: 'Final',
          title: `${course.name} - Final Exam`,
          date: examDate,
          startTime: '10:00',
          endTime: '13:00',
          duration: 180,
          totalMarks: 100,
          totalQuestions: 100,
          questions: [],
          systemAssignments, // Contains markers for rescheduled
          attendanceEnabled: true,
          status: 'Scheduled',
          multiSection: false,
          sections: []
        }
        finalExams.push(mainExam)

        // If we have rescheduled students, create the separate Rescheduled Exam entry
        if (rescheduledStudents.length > 0) {
          const rescheduledExam = {
            courseId: courseAssignment.courseId,
            instituteId: institute._id,
            type: 'Final',
            title: `${course.name} - Final Exam (Rescheduled)`,
            date: new Date(examDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            totalMarks: 100,
            totalQuestions: 100,
            questions: [], // Ideally same questions
            systemAssignments: rescheduledStudents,
            attendanceEnabled: true,
            status: 'Scheduled',
            multiSection: false,
            sections: []
          }
          rescheduledExamsToCreate.push(rescheduledExam)
        }
      }
    }

    const createdFinalExams = await Exam.insertMany(finalExams)
    const createdRescheduledExams = await Exam.insertMany(rescheduledExamsToCreate)

    console.log(`✅ Created ${createdFinalExams.length} main final exams`)
    console.log(`✅ Created ${createdRescheduledExams.length} rescheduled exams`)

    // 10. Admit Cards
    console.log('🎫 Creating admit cards...')
    const admitCards = []

    // For main exams
    for (const exam of createdFinalExams) {
      for (const sa of exam.systemAssignments) {
        if (!sa.isRescheduled) { // Only for non-rescheduled in main exam
          const student = createdStudents.find(s => s._id.toString() === sa.studentId.toString())
          const course = courses.find(c => c._id.toString() === exam.courseId.toString())
          const institute = institutes.find(i => i._id.toString() === exam.instituteId.toString())

          admitCards.push({
            studentId: student._id,
            examId: exam._id,
            studentName: student.name,
            rollNo: student.rollNo,
            courseName: course.name,
            examTitle: exam.title,
            examDate: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            duration: exam.duration,
            systemName: sa.systemName,
            instituteName: institute.name,
            sectionNumber: sa.sectionNumber,
            rescheduled: false
          })
        }
      }
    }

    // For rescheduled exams
    for (const exam of createdRescheduledExams) {
      for (const sa of exam.systemAssignments) {
        const student = createdStudents.find(s => s._id.toString() === sa.studentId.toString())
        const course = courses.find(c => c._id.toString() === exam.courseId.toString())
        const institute = institutes.find(i => i._id.toString() === exam.instituteId.toString())

        admitCards.push({
          studentId: student._id,
          examId: exam._id,
          studentName: student.name,
          rollNo: student.rollNo,
          courseName: course.name,
          examTitle: exam.title,
          examDate: exam.date,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration,
          systemName: sa.systemName,
          instituteName: institute.name,
          sectionNumber: 999,
          rescheduled: true,
          rescheduledReason: sa.rescheduledReason
        })
      }
    }

    await AdmitCard.insertMany(admitCards)
    console.log(`✅ Created ${admitCards.length} admit cards`)


    // 11. Create Payments & Transactions
    console.log('💰 Creating payments & transactions...')
    const payments = []
    const transactions = []

    for (const student of createdStudents) {
      for (const courseEnrollment of student.courses) {
        const institute = institutes.find(i => i._id.toString() === student.instituteId.toString())
        const courseAssignment = institute.courses.find(c => c.courseId.toString() === courseEnrollment.courseId.toString())
        const course = courses.find(c => c._id.toString() === courseEnrollment.courseId.toString())

        const bookPrice = courseEnrollment.booksIncluded ? course.bookPrice : 0
        const deliveryCharge = courseEnrollment.booksIncluded ? course.deliveryCharge : 0
        const totalAmount = course.baseFee + course.examFee + bookPrice + deliveryCharge

        const payment = {
          instituteId: institute._id,
          studentId: student._id,
          courseId: course._id,
          baseFee: course.baseFee,
          examFee: course.examFee,
          bookPrice,
          deliveryCharge,
          totalAmount,
          status: Math.random() > 0.3 ? 'Paid' : 'Pending', // 70% paid
          paymentMethod: 'UPI',
          transactionId: `TXN${Math.floor(Math.random() * 100000)}`,
          paidAt: courseEnrollment.enrolledAt,
          createdAt: courseEnrollment.enrolledAt
        }
        payments.push(payment)
      }
    }

    const createdPayments = await Payment.insertMany(payments)

    // Generate transactions for paid payments
    for (const payment of createdPayments) {
      if (payment.status === 'Paid') {
        transactions.push({
          type: 'Income',
          category: 'Fee Collection',
          description: `Fee collected from ${payment.instituteId}`,
          amount: payment.totalAmount,
          instituteId: payment.instituteId,
          paymentId: payment._id,
          commission: payment.totalAmount * 0.10,
          date: payment.paidAt
        })
      }
    }

    // Add some random Expenses
    transactions.push({
      type: 'Expense',
      category: 'Server & Hosting',
      description: 'AWS Monthly Bill',
      amount: 15000,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      commission: 0
    })
    transactions.push({
      type: 'Expense',
      category: 'Office Rent',
      description: 'HQ Rent',
      amount: 50000,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      commission: 0
    })

    await Transaction.insertMany(transactions)
    console.log(`✅ Created ${createdPayments.length} payments and ${transactions.length} transactions`)

    // 12. Create Enquiries & Support Tickets
    console.log('📨 Creating enquiries and tickets...')
    const enquiries = []
    const tickets = []

    // Enquiries
    for (let i = 0; i < 10; i++) {
      enquiries.push({
        name: `Enquirer ${i}`,
        email: `enq${i}@test.com`,
        phone: `999888777${i}`,
        courseId: courses[i % courses.length]._id,
        instituteId: institutes[i % institutes.length]._id,
        message: 'Interested in this course details',
        status: 'Pending'
      })
    }
    await Enquiry.insertMany(enquiries)

    // Tickets
    for (const admin of admins) {
      tickets.push({
        userId: admin._id,
        instituteId: admin.instituteId,
        subject: 'System access issue',
        description: 'Facing latency in dashboard',
        priority: 'High',
        status: 'Open',
        category: 'Technical'
      })
    }
    await SupportTicket.insertMany(tickets)
    console.log(`✅ Created enquiries and support tickets`)

    console.log('✨ Data seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
