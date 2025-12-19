import mongoose from 'mongoose'

const FeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema)
