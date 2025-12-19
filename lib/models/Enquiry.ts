import mongoose from 'mongoose'

const EnquirySchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  courseInterested: { type: String, required: true },
  status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Lost'], default: 'New' },
  notes: { type: String },
  followUpDate: { type: Date },
  handledBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'handledByModel' },
  handledByModel: { type: String, enum: ['User', 'Staff'] },
  source: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema)
