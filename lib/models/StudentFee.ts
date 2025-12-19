import mongoose from 'mongoose'

const StudentFeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  totalFee: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, required: true },
  installments: [{
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date },
    status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
    paidOn: { type: Date },
    paymentMethod: { type: String },
    transactionId: { type: String },
    receiptNo: { type: String }
  }],
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.StudentFee || mongoose.model('StudentFee', StudentFeeSchema)
