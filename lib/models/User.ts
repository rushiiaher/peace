import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super-admin', 'institute-admin', 'student', 'faculty'], required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  rollNo: { type: String, unique: true, sparse: true },
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    booksIncluded: { type: Boolean, default: false },
    enrolledAt: { type: Date, default: Date.now },
    accessExpiresAt: { type: Date }, // Snapshotted expiry date
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' }
  }],
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  guardianName: { type: String },
  guardianPhone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  documents: {
    photo: { type: String },
    idProof: { type: String },
    idProofType: { type: String, enum: ['Aadhar', 'PAN', 'Passport', 'Driving License'] },
    certificates: [{ type: String }]
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
