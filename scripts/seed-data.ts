import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmsdb'

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  instituteId: String,
  createdAt: Date
})

const CourseSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  duration: String,
  fee: Number,
  createdAt: Date
})

const InstituteSchema = new mongoose.Schema({
  name: String,
  location: String,
  email: String,
  phone: String,
  address: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  status: String,
  pendingPayment: Number,
  createdAt: Date
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)
const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  await User.deleteMany({})
  await Course.deleteMany({})
  await Institute.deleteMany({})
  
  await User.insertMany([
    {
      email: 'superadmin@lms.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super-admin',
      createdAt: new Date()
    },
    {
      email: 'admin@institute.com',
      password: hashedPassword,
      name: 'Institute Admin',
      role: 'institute-admin',
      instituteId: 'inst-001',
      createdAt: new Date()
    },
    {
      email: 'student@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'student',
      instituteId: 'inst-001',
      createdAt: new Date()
    }
  ])

  const courses = await Course.insertMany([
    {
      name: 'Web Development',
      code: 'WD101',
      category: 'Web Development',
      description: 'Full Stack Web Development',
      duration: '6 months',
      baseFee: 30000,
      examFee: 2000,
      bookPrice: 1500,
      deliveryCharge: 200,
      createdAt: new Date()
    },
    {
      name: 'Data Science',
      code: 'DS101',
      category: 'Data Science',
      description: 'Data Science and Machine Learning',
      duration: '8 months',
      baseFee: 45000,
      examFee: 3000,
      bookPrice: 2500,
      deliveryCharge: 200,
      createdAt: new Date()
    },
    {
      name: 'Mobile App Development',
      code: 'MAD101',
      category: 'Mobile Development',
      description: 'iOS and Android Development',
      duration: '5 months',
      baseFee: 35000,
      examFee: 2500,
      bookPrice: 2000,
      deliveryCharge: 200,
      createdAt: new Date()
    }
  ])

  await Institute.insertMany([
    {
      name: 'Tech Learning Institute',
      location: 'Bangalore',
      email: 'info@techlearning.com',
      phone: '+91 9876543210',
      address: '123 Tech Street, Bangalore',
      courses: [courses[0]._id, courses[1]._id],
      status: 'Active',
      pendingPayment: 45000,
      createdAt: new Date()
    },
    {
      name: 'Smart Academy',
      location: 'Mumbai',
      email: 'contact@smartacademy.com',
      phone: '+91 9876543211',
      address: '456 Smart Road, Mumbai',
      courses: [courses[2]._id],
      status: 'Active',
      pendingPayment: 0,
      createdAt: new Date()
    }
  ])
  
  console.log('✅ Database seeded successfully!')
  console.log('\nTest Credentials:')
  console.log('Super Admin: superadmin@lms.com / password123')
  console.log('Institute Admin: admin@institute.com / password123')
  console.log('Student: student@example.com / password123')
  console.log('\nSample Data:')
  console.log('- 3 Courses added')
  console.log('- 2 Institutes added with assigned courses')
  
  await mongoose.disconnect()
}

seed().catch(console.error)
