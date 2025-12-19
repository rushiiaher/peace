import mongoose from 'mongoose'

const ExamResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number },
  timeTaken: { type: Number },
  submittedAt: { type: Date, default: Date.now }
})

export default mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema)
