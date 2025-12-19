import mongoose from 'mongoose'

const FeedbackFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
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

export default mongoose.models.FeedbackForm || mongoose.model('FeedbackForm', FeedbackFormSchema)
