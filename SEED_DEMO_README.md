# Demo Database Seed Script

## Overview
This script creates a complete demo database for the LMS system with realistic data including institutes, courses, students, exams, results, feedback, and fee payments.

## What Gets Created

### 📚 **7 Courses**
1. Full Stack Web Development (FSWD101)
2. Data Science & AI (DSAI201)
3. Digital Marketing (DM301)
4. Mobile App Development (MAD401)
5. Cloud Computing & DevOps (CCDO501)
6. Cybersecurity Fundamentals (CS601)
7. UI/UX Design (UIUX701)

### 🏢 **3 Institutes**
1. **Tech Institute Mumbai** (TIM001)
   - Courses: Full Stack, Data Science, Mobile App
   - Location: Mumbai

2. **Digital Academy Pune** (DAP002)
   - Courses: Digital Marketing, Cloud Computing, UI/UX
   - Location: Pune

3. **Cyber Institute Bangalore** (CIB003)
   - Courses: Cybersecurity, Full Stack, Data Science
   - Location: Bangalore

### 👥 **30+ Students**
- 10 students per course
- Distributed across 3 institutes
- Some with books, some without
- Realistic names and contact details

### ❓ **Question Banks**
- 5 Question Banks per course (35 total)
- 50 questions per QB (1,750 total questions)
- Topics: Basics, Intermediate, Advanced, Practical, Theory

### 📝 **DPPs (Daily Practice Papers)**
- 1 DPP per Question Bank per Institute
- 20 questions per DPP
- 30-minute duration
- Results for 70% of students

### 🎓 **Final Exams**
- 1 Final Exam per course per institute
- Attendance enabled with system assignments
- 80% attendance rate
- Results for attended students

### 💬 **Feedback Forms**
- 1 form per course per institute (9 total)
- 11 questions per form
- 60% response rate from students

### 💰 **Fee Payments**
- 70% of students have made payments
- Mix of full and partial payments
- Various payment modes (Cash, UPI, Card, Bank Transfer)
- Receipt numbers generated

## How to Run

### Prerequisites
1. MongoDB running locally or connection string in `.env.local`
2. Node.js and npm/pnpm installed

### Steps

1. **Ensure MongoDB is running**
   ```bash
   # If using local MongoDB
   mongod
   ```

2. **Set environment variable** (if not already set)
   ```bash
   # In .env.local
   MONGODB_URI=mongodb://localhost:27017/lms
   ```

3. **Run the seed script**
   ```bash
   npm run seed-demo
   # or
   pnpm seed-demo
   ```

4. **Wait for completion**
   - The script will clear existing data (except super admin)
   - Create all demo data
   - Show progress and summary

## Login Credentials

### Super Admin
- Use your existing super admin credentials

### Institute Admins
- **Email:** `rajesh@techmumbai.edu` (Mumbai)
- **Email:** `priya@digitalpune.edu` (Pune)
- **Email:** `amit@cyberblr.edu` (Bangalore)
- **Password:** `admin123`

### Students
- **Email:** `student1@example.com` to `student30@example.com`
- **Password:** `student123`

## Data Summary

After running the script, you'll have:

| Item | Count |
|------|-------|
| Courses | 7 |
| Institutes | 3 |
| Institute Admins | 3 |
| Students | 30+ |
| Question Banks | 35 |
| Total Questions | 1,750 |
| DPPs | 105+ |
| DPP Results | 70+ |
| Final Exams | 9 |
| Final Exam Results | 20+ |
| Feedback Forms | 9 |
| Feedback Responses | 15+ |
| Fee Payments | 20+ |

## Features Demonstrated

### ✅ Course Enrollment
- Students enrolled in different courses
- Some courses marked as completed (enrollment closed)
- Institute-specific pricing

### ✅ Books Inclusion
- ~60% students have books included
- ~40% students without books
- Fee calculation reflects book inclusion

### ✅ Exam System
- DPPs with multiple attempts
- Final exams with attendance tracking
- System assignments for students
- Results and scoreboards

### ✅ Fee Management
- Full payments (~70% of paying students)
- Partial payments (~30% of paying students)
- Various payment modes
- Receipt generation

### ✅ Feedback System
- Forms created by super admin
- Responses from students
- Mix of submitted and pending feedback

### ✅ Attendance Tracking
- Students assigned to systems
- 80% attendance rate
- Only attended students have results

## Testing Scenarios

After seeding, you can test:

1. **Super Admin Panel:**
   - View all institutes, courses, students
   - Check payment reports
   - View feedback responses
   - Monitor exam results

2. **Institute Admin Panel:**
   - Login as any institute admin
   - View enrolled students
   - Check pending fees
   - Mark attendance for exams
   - Collect fee payments

3. **Student Panel:**
   - Login as any student
   - Attempt DPPs (multiple times)
   - View results and scoreboards
   - Check fee status
   - Submit pending feedback

## Resetting Data

To reset and reseed:
```bash
npm run seed-demo
```

The script automatically clears existing data before seeding.

## Notes

- Super admin credentials are preserved
- All passwords are hashed using bcrypt
- Dates are randomized within realistic ranges
- Student names are randomly generated from Indian names
- Receipt numbers are sequential (RCP1000, RCP1001, etc.)

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running

### Duplicate Key Error
```
Error: E11000 duplicate key error
```
**Solution:** The script clears data first, but if error persists, manually clear collections

### Out of Memory
```
Error: JavaScript heap out of memory
```
**Solution:** Increase Node.js memory limit:
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run seed-demo
```

## Support

If you encounter issues:
1. Check MongoDB connection
2. Verify `.env.local` has correct MONGODB_URI
3. Ensure all dependencies are installed
4. Check console output for specific errors
