import mongoose from 'mongoose'

const FinalResultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },

    // Stores marks for dynamic components (VIVA, PRACTICAL, etc.)
    evaluationMarks: [{
        name: { type: String, required: true }, // e.g., "VIVA"
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, required: true }
    }],

    // Aggregated scores
    onlineExamScore: { type: Number, default: 0 }, // From ExamResults if applicable
    totalScore: { type: Number, required: true },
    totalMaxMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },

    status: { type: String, enum: ['Pending', 'Finalized'], default: 'Pending' },
    submittedToSuperAdmin: { type: Boolean, default: false },
    submittedAt: { type: Date },

    // Inventory tracking
    certificateDispatched: { type: Boolean, default: false },
    certificateDispatchedAt: { type: Date },
    certificateReceived: { type: Boolean, default: false },
    certificateReceivedAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

// Prevent duplicate results for same student in same course
FinalResultSchema.index({ studentId: 1, courseId: 1 }, { unique: true })

export default mongoose.models.FinalResult || mongoose.model('FinalResult', FinalResultSchema)
