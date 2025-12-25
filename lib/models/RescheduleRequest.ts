import mongoose from 'mongoose'

const RescheduleRequestSchema = new mongoose.Schema({
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
    originalExamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    newExamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' } // If approved and scheduled
})

export default mongoose.models.RescheduleRequest || mongoose.model('RescheduleRequest', RescheduleRequestSchema)
