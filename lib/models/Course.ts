import mongoose from 'mongoose'

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  category: { type: String },
  about: { type: String },
  syllabus: { type: String },
  description: { type: String },
  duration: { type: String },
  finalExamCount: { type: Number, default: 1 },
  baseFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  bookPrice: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  certificateCharge: { type: Number, default: 60 },
  evaluationComponents: [{
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Course || mongoose.model('Course', CourseSchema)
