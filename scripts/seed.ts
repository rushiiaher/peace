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

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  await User.deleteMany({})
  
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
  
  console.log('✅ Database seeded successfully!')
  console.log('\nTest Credentials:')
  console.log('Super Admin: superadmin@lms.com / password123')
  console.log('Institute Admin: admin@institute.com / password123')
  console.log('Student: student@example.com / password123')
  
  await mongoose.disconnect()
}

seed().catch(console.error)
