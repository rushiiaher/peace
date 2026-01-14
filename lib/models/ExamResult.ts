import mongoose from 'mongoose'

const ExamResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number },
  timeTaken: { type: Number },
  submittedAt: { type: Date, default: Date.now },
  superseded: { type: Boolean, default: false }, // True if replaced by rescheduled exam result
  supersededBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamResult' } // Points to new result
})

ExamResultSchema.index({ examId: 1, studentId: 1 })

export default mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema)
