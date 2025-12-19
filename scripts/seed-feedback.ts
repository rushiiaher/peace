import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmsdb'

const FeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: String,
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  rating: Number,
  feedback: String,
  createdAt: Date
})

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  
  const institutes = await mongoose.connection.db.collection('institutes').find().toArray()
  const courses = await mongoose.connection.db.collection('courses').find().toArray()
  const users = await mongoose.connection.db.collection('users').find({ role: 'student' }).toArray()

  if (institutes.length === 0 || courses.length === 0) {
    console.log('Please run seed-data first to create institutes and courses')
    await mongoose.disconnect()
    return
  }

  await Feedback.deleteMany({})

  const feedbacks = [
    {
      studentId: users[0]?._id,
      studentName: 'John Doe',
      instituteId: institutes[0]._id,
      courseId: courses[0]._id,
      rating: 5,
      feedback: 'Excellent course! The instructors are very knowledgeable and the curriculum is well-structured.',
      createdAt: new Date()
    },
    {
      studentId: users[0]?._id,
      studentName: 'Jane Smith',
      instituteId: institutes[0]._id,
      courseId: courses[1]._id,
      rating: 4,
      feedback: 'Great learning experience. The practical sessions were very helpful.',
      createdAt: new Date()
    },
    {
      studentId: users[0]?._id,
      studentName: 'Mike Johnson',
      instituteId: institutes[1]._id,
      courseId: courses[2]._id,
      rating: 5,
      feedback: 'Outstanding institute with modern facilities and experienced faculty.',
      createdAt: new Date()
    },
    {
      studentId: users[0]?._id,
      studentName: 'Sarah Williams',
      instituteId: institutes[0]._id,
      courseId: courses[0]._id,
      rating: 4,
      feedback: 'Good course content and supportive staff. Would recommend to others.',
      createdAt: new Date()
    }
  ]

  await Feedback.insertMany(feedbacks)
  
  console.log('✅ Feedback data seeded successfully!')
  console.log(`- ${feedbacks.length} feedbacks added`)
  
  await mongoose.disconnect()
}

seed().catch(console.error)
