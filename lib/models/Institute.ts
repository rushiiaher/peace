import mongoose from 'mongoose'

const CourseAssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  institutePrice: { type: Number, default: 0 },
  enrollmentActive: { type: Boolean, default: true }
})

const InstituteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  courses: [CourseAssignmentSchema],
  systems: [{
    name: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Occupied'], default: 'Available' }
  }],
  examTimings: {
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '18:00' },
    sectionDuration: { type: Number, default: 180 },
    breakBetweenSections: { type: Number, default: 30 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  pendingPayment: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Institute || mongoose.model('Institute', InstituteSchema)
