import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  firstName: { type: String }, // Structred Name Part 1
  middleName: { type: String }, // Structred Name Part 2
  lastName: { type: String }, // Structred Name Part 3
  role: { type: String, enum: ['super-admin', 'institute-admin', 'student', 'faculty'], required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  rollNo: { type: String, unique: true, sparse: true },
  courses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    booksIncluded: { type: Boolean, default: false },
    enrolledAt: { type: Date, default: Date.now },
    accessExpiresAt: { type: Date }, // Snapshotted expiry date
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    royaltyPaid: { type: Boolean, default: false },
    royaltyPaidAt: { type: Date },
    royaltyAmount: { type: Number },
    booksDispatched: { type: Boolean, default: false },
    booksReceived: { type: Boolean, default: false }
  }],
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  guardianName: { type: String },
  guardianPhone: { type: String },
  motherName: { type: String }, // NEW
  bloodGroup: { type: String }, // NEW
  aadhaarCardNo: {
    type: String,
    validate: {
      validator: function (v: string) {
        // Optional field, but if present must be 12 digits
        return !v || /^\d{12}$/.test(v)
      },
      message: 'Aadhaar Card No must be exactly 12 digits'
    }
  }, // NEW
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  documents: {
    photo: { type: String },
    idProof: { type: String },
    idProofType: { type: String, enum: ['Aadhar', 'PAN', 'Passport', 'Driving License'] },
    certificates: [{ type: String }]
  },
  lastLogin: { type: Date },
  lastActiveAt: { type: Date }, // For session tracking
  sessionToken: { type: String }, // For single session enforcement
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
