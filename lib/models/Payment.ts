import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  baseFee: { type: Number, required: true },
  examFee: { type: Number, required: true },
  bookPrice: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  certificateCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String },
  transactionId: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
