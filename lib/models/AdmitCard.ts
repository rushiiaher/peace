import mongoose from 'mongoose'

const AdmitCardSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  batchName: { type: String, required: true, default: 'Regular Batch' },
  examTitle: { type: String, required: true },
  examNumber: { type: Number },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  systemName: { type: String, required: true },
  instituteName: { type: String, required: true },
  sectionNumber: { type: Number, default: 1 },
  isRescheduled: { type: Boolean, default: false },
  rescheduledReason: { type: String },
  generatedAt: { type: Date, default: Date.now }
})

// Add virtual for backward compatibility
AdmitCardSchema.virtual('rescheduled').get(function () {
  return this.isRescheduled
})

AdmitCardSchema.set('toJSON', { virtuals: true })
AdmitCardSchema.set('toObject', { virtuals: true })

export default mongoose.models.AdmitCard || mongoose.model('AdmitCard', AdmitCardSchema)
