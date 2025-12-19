import mongoose from 'mongoose'

const FeedbackResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackForm', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  responses: [{
    questionId: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  submittedAt: { type: Date, default: Date.now }
})

export default mongoose.models.FeedbackResponse || mongoose.model('FeedbackResponse', FeedbackResponseSchema)
