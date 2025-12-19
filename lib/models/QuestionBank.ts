import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String }
})

const QuestionBankSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  topic: { type: String, required: true },
  questions: [QuestionSchema],
  hasDPP: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.QuestionBank || mongoose.model('QuestionBank', QuestionBankSchema)
