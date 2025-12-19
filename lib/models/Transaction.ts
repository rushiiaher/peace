import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  commission: { type: Number, default: 0 },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
