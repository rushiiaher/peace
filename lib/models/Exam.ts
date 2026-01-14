import mongoose from 'mongoose'

const ExamSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  type: { type: String, enum: ['DPP', 'Final', 'MidSem'], required: true },
  title: { type: String, required: true },
  examNumber: { type: Number },
  questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  date: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number }
  }],
  sections: [{
    sectionNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    systemAssignments: [{
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      systemName: { type: String },
      attended: { type: Boolean, default: false },
      isRescheduled: { type: Boolean, default: false },
      rescheduledReason: { type: String }
    }]
  }],
  systemAssignments: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    systemName: { type: String },
    sectionNumber: { type: Number, default: 1 },
    attended: { type: Boolean, default: false },
    isRescheduled: { type: Boolean, default: false },
    rescheduledReason: { type: String }
  }],
  attendanceEnabled: { type: Boolean, default: false },
  multiSection: { type: Boolean, default: false },
  status: { type: String, enum: ['Scheduled', 'Active', 'Completed'], default: 'Scheduled' },
  createdAt: { type: Date, default: Date.now }
})

ExamSchema.index({ courseId: 1, instituteId: 1, type: 1 })
ExamSchema.index({ instituteId: 1 })

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema)
