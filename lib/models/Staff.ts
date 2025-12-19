import mongoose from 'mongoose'

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['Faculty', 'Admin Staff'], required: true },
  department: { type: String },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  salary: { type: Number, default: 0 },
  joiningDate: { type: Date, default: Date.now },
  address: { type: String },
  qualification: { type: String },
  experience: { type: Number },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema)
