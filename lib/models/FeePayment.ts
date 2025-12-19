import mongoose from 'mongoose'

const FeePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], required: true },
  receiptNumber: { type: String, required: true, unique: true },
  paymentDate: { type: Date, default: Date.now },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema)
