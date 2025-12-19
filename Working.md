# LMS System - Complete Working Documentation

## System Overview
This Learning Management System (LMS) has **3 main panels** with distinct roles and interconnected workflows:
1. **Super Admin Panel** - System-wide management
2. **Institute Admin Panel** - Institute-specific operations  
3. **Student Panel** - Learning and exam interface

---

## 1. SUPER ADMIN PANEL

### 1.1 Institute Management
**Purpose:** Create and manage educational institutes across the system

**Add Institute:**
- Institute Name
- Institute Code (e.g., INST01)
- Location
- Email
- Phone
- Address
- Status (Active/Inactive)
- **Deactivation Feature:** Super Admin can deactivate an institute.
  - **Effect:** Institute Admin is blocked from all pages except the "Payments" page.
  - **Blocking UI:** A full-screen overlay warns the admin to clear dues.

**Edit Details:**
- Update all institute information
- Modify pending payment amounts
- Change status (Active/Inactive)

**Manage Courses:**
- Assign courses to institutes
- Set course start date and end date
- Activate/Deactivate enrollment for specific courses
- Edit course assignment dates
- Remove courses from institutes
- Set institute-specific pricing (optional override)

**Delete:**
- Remove institute from system (with confirmation)

**Interconnection:** When courses are assigned to institutes, they become available for:
- Institute admins to enroll students
- Students to access course materials and exams

---

### 1.2 Course Management
**Purpose:** Create courses with pricing that institutes can offer

**UI Design:**
- **Professional Cards:** Clean, typographic layout without heavy background colors.
- **Visual Hierarchy:** Clear display of fees, institute count, and status.

**Add Course:**
- Course Name
- Course Code
- Category
- Duration (e.g., 6 months)
- Final Exam Count
- About Course (description)
- Syllabus (detailed content)
- Description (brief overview)

**Pricing Structure:**
- Base Course Fee (₹)
- Exam Fee (₹)
- Book Price (₹)
- Delivery Charge (₹)
- **Certificate Delivery Charge:** Fixed ₹60 per enrollment (auto-added).
- Total Fee (auto-calculated)

**Edit Pricing:**
- Modify all course details and fees
- Update syllabus and descriptions

**Delete:**
- Remove course from system

**Interconnection:** Courses created here are:
- Assigned to institutes by super admin
- Used to create Question Banks
- Used to create DPPs and Final Exams
- Enrolled by students through institute admin

---

### 1.3 User Management
**Purpose:** Create and manage all system users

**Access Restrictions:**
- Super Admin can create Institute Admins, Faculty, and Students
- Super Admin CANNOT enroll students in courses (only Institute Admin can)
- Super Admin can only create student accounts, not assign courses

**Create User Types:**

**Institute Admin:**
- Full Name
- Email
- Password (system generates or manual entry)
- Institute (optional assignment)
- Status (Active/Inactive)
- **Login Credentials:** Email and password are sent to the admin
- **Access:** Can login to Institute Admin panel immediately after creation

**Faculty:**
- Full Name
- Email
- Password
- Institute (optional assignment)
- Status (Active/Inactive)

**Student:**
- Full Name
- Email
- Password (system generates or manual entry)
- Roll Number (auto-generated based on institute or manual)
- Institute (required)
- Course Assignment (optional - mainly done by Institute Admin)
- Phone
- Address
- Date of Birth
- Guardian Name
- Guardian Phone
- Status (Active/Inactive)
- **Login Credentials:** Email and password provided during creation
- **Access:** Can login to Student panel after creation
- **Note:** Super Admin can create student accounts but course enrollment is primarily handled by Institute Admin
- **Enrollment Rule:** Students CANNOT be enrolled in a course if the Final Exam for that course is scheduled within the next 7 days. Enrollment must happen at least 7 days prior to the exam date to ensure system allocation and admit card generation.

**User Actions:**
- Edit user details
- Activate/Deactivate users
- Delete users
- View last login time
- Filter by role (All/Institute Admin/Faculty/Student)
- Change password

**Interconnection:** 
- **Institute Admins:** Created here → Receive login credentials → Login to Institute Admin panel → Manage their institute
- **Students:** Created here OR by Institute Admin → Receive credentials → Login to Student panel → Access courses and exams
- **Faculty:** Created here → Can manage batches and attendance

---

### 1.4 Question Bank Management
**Purpose:** Create question repositories for courses

**Add Question Bank:**
- Select Course
- Topic Name
- Add Multiple Questions:
  - Question Text
  - 4 Options (Option 1, 2, 3, 4)
  - Correct Answer (select from 1-4)
  - Explanation (optional)
  - **Marking:** All questions standardized to **2 marks** each.

**View Questions:**
- Search questions within QB
- View all questions with correct answers highlighted
- See question count

**Edit Question Bank:**
- Modify topic name
- Add new questions
- Edit existing questions
- Delete individual questions

**Delete:**
- Remove entire question bank

**DPP Restrictions & Deletion Logic:**
- Once a DPP is created from a Question Bank, that QB is marked as "hasDPP: true"
- QBs with existing DPPs are automatically filtered out from DPP creation selection (excludeWithDPP=true)
- This prevents duplicate DPPs from same question set
- Each QB can have ONLY ONE DPP (not one per institute)
- DPPs are institute-neutral and accessible to all students of that course

**DPP Deletion & QB Reuse:**
- When a DPP is deleted, the system automatically:
  - Finds the linked Question Bank using `questionBankId`
  - Sets QB's `hasDPP` flag back to `false`
  - Makes the QB available again for new DPP creation
  - Deletes associated admit cards (if any)
- After deletion, the QB reappears in the "Select Question Bank" dropdown
- Allows recreating DPPs from the same QB if needed

**Technical Implementation:**
- DPP model stores `questionBankId` field linking to source QB
- DELETE endpoint checks if exam type is 'DPP' and has `questionBankId`
- Updates QB's `hasDPP` field to false on deletion
- Frontend refreshes QB list after deletion to show newly available QBs

**Interconnection:** Question Banks are used to:
- Create DPPs (Daily Practice Papers)
- Generate Final Exam questions
- Provide practice material for students

---

### 1.5 Exam Management (DPP & Final Exams)

#### Create DPP (Daily Practice Paper)
**Purpose:** Generate daily practice tests from Question Banks

**DPP Creation Steps:**
1. Select Course
2. Select Question Bank (only QBs without existing DPPs shown - excludeWithDPP filter)
3. Enter/Edit DPP Title (auto-filled with QB topic name, can be customized)
4. Enter number of questions to include
5. Create DPP

**System Behavior:**
- Creates ONE DPP per Question Bank (institute-neutral, not per institute)
- DPP is accessible to ALL students enrolled in that course across ALL institutes
- Assigns sequential DPP numbers per course (DPP 1, DPP 2, etc.)
- Sets 30-minute duration
- Marks QB as "hasDPP: true" to prevent duplicate DPPs from same QB
- Sets status as "Active"
- Does NOT create separate DPPs for each institute
- Saves `questionBankId` reference for deletion tracking

**DPP Title Customization:**
- Default title: QB topic name (e.g., "Full Stack Web Development - Basics")
- Can be edited before creation
- Allows descriptive naming for better organization

**Important:** DPPs are course-level, not institute-level. One DPP per QB is created and shared across all institutes offering that course.

**DPP Features:**
- Students can attempt multiple times
- Instant results with percentage
- Auto-graded based on correct answers
- Shows correct answers after submission

**Access Restrictions:**
- DPPs are ONLY for students
- Institute Admin CANNOT attempt or solve DPPs
- Institute Admin can only VIEW DPP scoreboards and results
- Super Admin CANNOT attempt DPPs either

#### Schedule Final Exam with Advanced System Allocation
**Purpose:** Create major examinations with intelligent system allocation, multi-section scheduling, and conflict detection

**Final Exam Creation:**
- Select Course
- Select Institute
- Exam Title
- Exam Date
- Start Time (system uses institute's exam timings)
- Select Question Banks (multiple allowed)
- Total Questions (randomly selected proportionally from selected QBs)

**Intelligent System Allocation:**
- System automatically allocates students to available computer systems
- Prevents timing conflicts - no two students get same system at same time
- Considers institute's exam timing configuration:
  - Opening Time (e.g., 09:00)
  - Closing Time (e.g., 18:00)
  - Section Duration (e.g., 180 minutes)
  - Break Between Sections (e.g., 30 minutes)
  - Working Days (e.g., Monday-Saturday)
- Handles different courses separately - no cross-course conflicts

**Multi-Section Scheduling:**
- When students exceed available systems, exam is split into multiple sections
- Each section gets:
  - Section Number (1, 2, 3, etc.)
  - Separate Date and Time slot
  - System assignments for that section's students
  - Proper time gaps between sections (break time)
- Sections scheduled within institute's working hours
- If day's hours are insufficient, continues next working day
- Automatically skips weekends/non-working days

**Scheduling Options:**
- **Schedule Exam:** Normal scheduling with automatic section allocation
- **Schedule Next Section:** Force exam to next available section slot
- **Schedule Next Day:** Force exam to next working day
- System checks:
  - Available systems in next section
  - Next day is not Sunday/holiday
  - Proper time gaps maintained

**Conflict Detection:**
- System ensures no student gets same system at overlapping times
- Validates against existing exam schedules
- Prevents double-booking of systems
- Checks course-specific exam schedules

**Automatic Admit Card Generation:**
- Admit cards generated for all students immediately after exam creation
- Each admit card contains:
  - Student name and roll number
  - Course name
  - Exam title and date
  - Exam time (start and end)
  - Duration
  - Allocated system name (e.g., System-01, PC-05, LAB-03)
  - Institute name
  - Section number (for multi-section exams)
- Students can view admit cards in their panel
- Shows which computer system they are assigned to

**Bulk Rescheduling for Technical Issues:**
- Super Admin can reschedule exam for multiple students who faced technical issues
- Use case: Students face technical issues during exam (system crash, network failure, power outage)
- Access: Click "Reschedule" button on Final Exam card

**Rescheduling Page Features:**
- Shows all students enrolled in the exam with detailed information:
  - Roll Number and Name
  - Original scheduled date and time
  - Allocated system name
  - Section number
  - Questions attempted count
  - Score obtained
  - Current status (Attended/Not Attended/Rescheduled)
- Select multiple students for bulk rescheduling
- "Select All" and "Clear All" buttons for convenience

**Rescheduling Process:**
1. Super Admin clicks "Reschedule" button on exam card
2. System displays student list with attempt data
3. Super Admin selects affected students (checkbox selection)
4. Enters new exam date
5. Enters reason for rescheduling (e.g., "System crashed", "Network issue", "Power failure")
6. Clicks "Reschedule" button
7. System automatically:
   - Creates NEW exam with title "[Original Title] (Rescheduled)"
   - Sets `attendanceEnabled: true` by default
   - Checks if selected date is Sunday/holiday → Moves to next working day
   - Allocates available systems to students
   - Prevents system conflicts with existing exams
   - Respects institute's opening/closing times
   - Creates new time slots if systems are occupied
   - Assigns section number 999 to all rescheduled students
   - Generates/updates admit cards with new date, time, system, and reason
   - Removes students from original exam

**System Allocation for Rescheduled Exams:**
- Checks existing exam schedules on selected date
- Identifies occupied systems and time slots
- Allocates available systems to rescheduled students
- If systems are full, creates new time slots with proper breaks
- If day's hours are insufficient, moves to next working day
- Ensures no conflicts with regular exam schedules

**Rescheduled Exam Management:**
- New exam created with "(Rescheduled)" suffix in title
- Appears in separate "Rescheduled Exams" tab in Super Admin panel
- Shows:
  - Rescheduled date and time
  - Total students rescheduled
  - Attendance enabled status (green badge)
  - List of all rescheduled students
- Actions available:
  - **Enable/Disable Attendance:** Toggle button (green when enabled)
  - **View Students:** See all rescheduled students with details
  - **Edit:** Modify rescheduled date, reason, add/remove students
  - **Undo Reschedules:** Move all students back to original exam

**Edit Rescheduled Exam:**
- Access: Click "Edit" button on rescheduled exam card
- Features:
  - Update rescheduled date (applies to all students)
  - Update rescheduling reason (applies to all students)
  - Add new students from original exam
  - Remove students (moves them back to original exam)
  - All changes update admit cards automatically
- API: `POST /api/exams/update-reschedule`

**Admit Card Updates:**
- Rescheduled students receive updated admit cards
- Shows new exam date and time
- Shows newly allocated system
- Displays "⚠ Rescheduled" badge with yellow alert
- Shows rescheduling reason in yellow alert box
- Section number shown as 999 (special identifier)
- Admit cards remain visible throughout (before, during, after exam)

**Super Admin Panel Features:**
- View all students enrolled in exam with attempt statistics
- Select multiple students for bulk rescheduling
- Set new exam date with automatic validation
- Enter rescheduling reason for audit trail
- Real-time system allocation and conflict detection
- Track rescheduled students with section 999 identifier
- Monitor questions attempted and scores before rescheduling
- Separate "Rescheduled Exams" tab for easy management
- Visual yellow "⚠ Rescheduled" badge on exam cards
- Enable/disable attendance for rescheduled exams

**Benefits:**
- Handles multiple students at once (bulk operation)
- Fair opportunity for students who faced genuine technical issues
- Automatic system allocation prevents manual errors
- Maintains exam integrity with proper scheduling
- Clear audit trail with rescheduling reasons
- Flexible editing of rescheduled exams
- Complete attendance control for rescheduled exams

**Attendance System:**
- Enable/Disable attendance for exam
- When enabled, system assigns students to computer systems
- Students must be marked present by institute admin to attempt exam
- Attendance tracking per student with system assignment
- Section-wise attendance for multi-section exams

**Edit Exam:**
- Update exam details (title, date, duration, total marks)
- Change status (Scheduled/Active/Completed)
- Enable/Disable attendance
- Cannot modify system allocations after creation
- **Restriction:** Edit button is disabled for completed exams to maintain data integrity

**Delete Exam:**
- Remove exam from system
- Deletes associated admit cards

**Rescheduled Exam Classification:**
- Filter option to classify exams with rescheduled students
- "Rescheduled Status" dropdown with options:
  - All Exams: Shows all final exams
  - With Rescheduled Students: Shows only exams that have students rescheduled
  - Normal Exams Only: Shows only exams without any rescheduled students
- Visual indicator: Yellow "⚠ Rescheduled" badge on exam cards with rescheduled students
- Helps Super Admin quickly identify exams requiring special attention
- Works alongside other filters (Course, Institute, Date, Status)

**Section Preview:**
- After scheduling, Super Admin sees:
  - Total sections created
  - Students per section
  - Time slots for each section
  - System allocations per section
  - Date distribution (if multi-day)
- Success message: "Exam scheduled in X sections" or "Exam scheduled"

**Interconnection:** Exams created here:
- Appear in Institute Admin panel for monitoring and attendance
- Appear in Student panel for attempting
- Generate results and scoreboards
- Create admit cards visible to students
- System allocations prevent conflicts
- Multi-section exams handled seamlessly

---

### 1.6 Feedback Management
**Purpose:** Create feedback forms for course evaluation

**Create Feedback Form:**
- Form Title
- Description
- Select Institute
- Select Course
- Add Questions:
  - Question Text
  - Question Type (Text/Rating/Choice)
  - Required (Yes/No - default true)
- Add/Remove questions dynamically

**View Responses:**
- See all student submissions
- Filter by form, institute, or course
- View individual responses with:
  - Student name and roll number
  - Course name
  - Submission date
  - All answers

**Delete Form:**
- Remove feedback form

**Statistics:**
- Total forms created
- Total responses received
- Average response rate

**Access Restrictions:**
- Only Super Admin can create feedback forms
- Institute Admin CANNOT create or view feedback forms
- Institute Admin has NO access to student feedback responses

**Interconnection:** Feedback forms:
- Created by Super Admin → Visible ONLY to students of selected institute/course
- Students submit responses → Responses go DIRECTLY to Super Admin
- Institute Admin has NO visibility of feedback forms or responses
- Help evaluate course effectiveness

---

### 1.7 Account Management
**Purpose:** Complete accounting system for tracking income, expenses, and financial transactions

**Features:**

**Dynamic Statistics Cards:**
- **Fee Collection:** Total fees collected from all institutes (auto-calculated from Payment model)
- **Total Income:** Sum of all income transactions including fee collections
- **Total Expense:** Sum of all expense transactions
- **Commission Earned:** Total commission from fee collections (10% of paid fees)

**Add Transaction Dialog:**
- Transaction Type: Income or Expense
- Category: Fee Collection, Server & Hosting, Marketing, Salaries, Office Rent, Utilities, Software Licenses, Maintenance, etc.
- Description: Detailed transaction notes
- Amount: Transaction value in ₹
- Commission: Commission amount (for income transactions)
- Institute: Link transaction to specific institute (optional)
- Date: Transaction date

**Advanced Filters:**
- **Type Filter:** All / Income / Expense
- **Institute Filter:** All Institutes / Specific Institute
- **Date Range:** Start Date and End Date filters
- Real-time data refresh on filter change

**Day Book (Transaction Ledger):**
- All transactions displayed in chronological order
- Color-coded cards:
  - Green background for Income transactions
  - Red background for Expense transactions
- Transaction details shown:
  - Category badge
  - Date with calendar icon
  - Institute name (if linked)
  - Commission amount (if applicable)
  - Transaction amount with +/- prefix
  - Type badge (Income/Expense)
- Hover effects for better UX
- Empty state message when no transactions found

**Automatic Fee Collection Integration:**
- When students pay fees through Institute Admin panel:
  - System automatically creates Income transaction
  - Links to Payment record
  - Links to Institute
  - Calculates 10% commission automatically
  - Sets transaction date as payment date
  - Category set as "Fee Collection"
  - Description includes institute name

**Sample Expense Categories:**
- Server & Hosting (AWS, cloud services)
- Marketing (digital campaigns, advertisements)
- Salaries (staff payments)
- Office Rent (monthly rent)
- Utilities (electricity, internet)
- Software Licenses (annual subscriptions)
- Maintenance (system maintenance)

**Amount Formatting:**
- Amounts displayed in readable format:
  - ₹10Cr+ for crores
  - ₹1L+ for lakhs
  - ₹1K+ for thousands
  - Full amount for smaller values

**Interconnection with Other Modules:**

**Payment Gateway Integration:**
- When Institute Admin collects fee → Payment record created with status "Paid"
- System automatically creates Transaction record:
  - Type: Income
  - Category: Fee Collection
  - Amount: Total payment amount
  - Commission: 10% of payment
  - Institute: Linked to payment's institute
  - Date: Payment date
- Fee Collection stat updates in real-time
- Commission Earned stat updates automatically

**Institute Management:**
- Transactions can be linked to specific institutes
- Filter transactions by institute
- Track institute-wise income
- Monitor institute-specific expenses

**Reports & Analytics:**
- Transaction data feeds into financial reports
- P&L statement uses income and expense data
- Revenue calculations include all income transactions
- Expense tracking for cost analysis

**API Endpoints:**
- `GET /api/transactions` - Fetch transactions with filters (type, instituteId, startDate, endDate)
- `POST /api/transactions` - Create new transaction
- `GET /api/accounting/stats` - Get aggregated statistics (totalIncome, totalExpense, commissionEarned, feeCollection)

**Database Models:**
- **Transaction Model:**
  - type: Income/Expense (required)
  - category: String (required)
  - description: String (required)
  - amount: Number (required)
  - instituteId: Reference to Institute (optional)
  - paymentId: Reference to Payment (optional)
  - commission: Number (default 0)
  - date: Date (required)
  - createdAt: Date (auto)

**Access Restrictions:**
- Only Super Admin can access Account Management
- Institute Admin cannot view accounting data
- Students cannot view accounting data
- All financial data is centralized at Super Admin level

**Workflow Example:**
1. Student pays ₹30,000 fee to Institute Admin
2. Institute Admin records payment in Fee Management
3. Payment record created with status "Paid"
4. System automatically creates Transaction:
   - Type: Income
   - Category: Fee Collection
   - Description: "Fee collection from Tech Institute Mumbai"
   - Amount: ₹30,000
   - Commission: ₹3,000 (10%)
   - Institute: Tech Institute Mumbai
   - Date: Payment date
5. Account Management stats update:
   - Fee Collection: +₹30,000
   - Total Income: +₹30,000
   - Commission Earned: +₹3,000
6. Transaction appears in Day Book
7. Super Admin can filter and view this transaction

**Manual Transaction Entry:**
1. Super Admin clicks "Add Transaction"
2. Selects Type (Income/Expense)
3. Enters Category (e.g., "Server & Hosting")
4. Adds Description (e.g., "AWS monthly bill")
5. Enters Amount (e.g., ₹15,000)
6. Optionally links to Institute
7. Sets Date
8. Submits transaction
9. Transaction appears in Day Book
10. Stats update automatically

---

### 1.8 Payment Gateway
**Purpose:** Track institute payments and student fee collections

**View Payments:**
- Institute-wise payment breakdown
- Pending payments tab
- Payment history tab
- Student count (with books / without books)
- Course-wise breakdown

**Payment Statistics:**
- Total pending amount
- Total paid amount
- Total students enrolled
- Active institutes count

**Payment Details:**
- Student name and course
- Total amount
- Paid amount
- Due amount
- Payment date
- Payment mode (Cash/UPI/Card/Bank Transfer/Cheque)
- Receipt number
- Books included status

**Interconnection:** Payment data flows from:
- Institute Admin collects fees → Records in system → Visible to Super Admin
- Student views fee status in their panel

---

### 1.9 Reports & Analytics
**Purpose:** System-wide reporting and insights

**Available Reports:**
- Total Revenue (₹)
- Total Institutes
- Total Students
- Average Pass Rate
- Student Enrollment Trends (chart)
- Institute Comparison (revenue, students, pass rate)
- Financial P&L Statement (Income, Expenses, Net Profit)

**Report Actions:**
- Generate custom reports
- Download reports
- View detailed breakdowns

---

### 1.10 Support Management
**Purpose:** Handle support tickets from institutes and students

**View Tickets:**
- All support requests
- Filter by status (Open/In Progress/Resolved)
- Filter by priority
- View ticket details

**Manage Tickets:**
- Respond to queries
- Update ticket status
- Assign to team members
- Close resolved tickets

---

### 1.11 Settings
**Purpose:** System configuration and preferences

**Settings Options:**
- System preferences
- Email configurations
- Notification settings
- Security settings

---

## 2. INSTITUTE ADMIN PANEL

### 2.1 Dashboard
**Purpose:** Overview of institute operations

**Metrics Displayed:**
- Total Students
- Active Courses
- Upcoming Exams
- Pending Fees
- Recent Activities

---

### 2.2 Student Management
**Purpose:** Manage students within the institute

**Access Restrictions:**
- ONLY Institute Admin can enroll students in courses
- Super Admin CANNOT enroll students in courses
- Institute Admin has full control over student course assignments

**Add Student:**
- Roll Number (auto-generated based on institute pattern)
- Full Name
- Email
- Password (system generates or manual)
- Phone
- Date of Birth
- Address
- Guardian Name
- Guardian Phone
- Assign Course (from institute's available courses)
- Include Books (Yes/No) - affects fee calculation

**Deactivation Feature:**
- Institute Admin can deactivate a student (e.g., for non-payment).
- **Effect:** Student is blocked from accessing ANY page in the student panel.
- **Blocking UI:** Full-screen "Account Deactivated" message.

**Edit Student:**
- Update personal details (name, email, phone, address, DOB)
- Change password
- Add/Remove courses
- Toggle book inclusion per course
- Update guardian information

**Delete Student:**
- Remove student from institute

**View Student Details:**
- Enrolled courses with book status
- Exam history
- Fee status (paid/pending)
- Attendance records
- Personal information

**Interconnection:** 
- Students added here → Receive login credentials → Can login to Student panel
- Student data flows to: Fee Management, Exam Management, Attendance tracking

---

### 2.3 Course Management
**Purpose:** View courses assigned to institute

**Access Restrictions:**
- Institute Admin CANNOT create courses
- Institute Admin CANNOT edit course details or pricing
- Institute Admin CANNOT delete courses
- Institute Admin can only VIEW courses assigned by Super Admin

**View Courses:**
- Course details (name, code, category, duration)
- Enrollment status (Open/Closed)
- Start and end dates
- Enrolled student count
- Fee structure (base fee, exam fee, book price, delivery charge)
- Institute-specific pricing

**Note:** All course creation and management is done by Super Admin only

---

### 2.4 Exam Management

#### View Exams
**Purpose:** Monitor all exams for the institute

**Access Restrictions:**
- Institute Admin CANNOT attempt or solve DPPs
- Institute Admin can only VIEW results and scoreboards
- DPPs are exclusively for students

**DPP Exams:**
- View all DPPs created for institute's courses
- See attempt statistics
- View scoreboard (top 10 students per DPP)
- Monitor completion rates
- CANNOT attempt DPPs themselves

**Final Exams:**
- View scheduled final exams
- See exam details (date, time, duration, total marks)
- Monitor attendance status
- View system assignments

#### Attendance Management
**Purpose:** Mark student attendance for final exams

**Attendance Features:**
- View students assigned to computer systems
- Mark students as Present/Absent
- System assignment details (System Name)
- Only present students can attempt exam
- Real-time attendance tracking

**Attendance Tab:**
- Shows only exams with attendance enabled
- Lists all assigned students
- Shows attendance status (Present/Absent)
- Mark Present button for absent students

**DPP Results Tab:**
- View scoreboard for each DPP
- Top 10 students per DPP
- Score, percentage, rank

**Overall Scoreboard:**
- Combined DPP performance across all DPPs
- Student rankings based on total DPP scores
- Percentage calculations
- Attempt counts
- Top 10 overall performers

**Rescheduled Exam Management:**

**Rescheduled Tab:**
- Dedicated tab showing all rescheduled exams
- Displays exams with "(Rescheduled)" in title
- Shows:
  - Exam title and course name
  - Rescheduled date and time
  - Total students rescheduled
  - Attendance enabled status
  - List of all rescheduled students with:
    - Student name and roll number
    - Allocated system (e.g., PC-05)
    - Section 999 badge
    - Attendance status (Present/Absent badge)
    - Rescheduling reason

**Attendance Tab (for Rescheduled Exams):**
- Rescheduled exams appear here when attendance is enabled
- Shows same interface as regular final exams
- Features:
  - Student name and allocated system
  - Attendance status (Present/Absent)
  - "Mark Present" button (before exam starts)
  - Button disabled after exam starts
  - Real-time status updates
- Institute Admin marks attendance → Student can attempt exam

**Institute Admin Panel Features:**
- View all rescheduled students with complete details
- See rescheduling reason for each student
- Mark attendance for rescheduled students on new date
- Monitor rescheduled student performance
- View updated system allocations
- Track section 999 students separately
- Visual yellow "⚠ Rescheduled" badge for easy identification
- Quickly identify exams requiring special attention

**Interconnection:** 
- Attendance marked here → Enables students to start final exams
- Results visible to students in their panel
- Rescheduled students → Updated schedules visible to Institute Admin
- Institute Admin marks attendance for rescheduled students → Students can attempt exam

---

### 2.5 Question Bank Management
**Purpose:** View question banks for institute's courses

**Access Restrictions:**
- Institute Admin has READ-ONLY access
- CANNOT create question banks
- CANNOT edit or delete question banks
- CANNOT add or modify questions

**View Only:**
- Can view questions for reference
- See which QBs are used in exams
- View question count per QB
- View question details (question, options, correct answer)

---

### 2.6 Fee Management
**Purpose:** Track and collect student fee payments

**Fee Collection:**
- View pending payments by student
- Collect fee with details:
  - Student name and roll number
  - Course name
  - Total amount
  - Already paid amount
  - Due amount
  - Amount to collect (input)
  - Payment mode (Cash/UPI/Card/Bank Transfer/Cheque)
  - Remarks (optional - transaction ID, notes)
- System generates receipt number automatically

**Fee Statistics:**
- Today's collection (₹)
- This month's collection (₹)
- Total outstanding (₹)
- Overdue students count

**Payment Tabs:**
- Pending Payments: Students with due amounts
- Recent Collections: Last 20 payment records

**Payment Details View:**
- Course fee breakdown (base fee + exam fee)
- Book price and delivery charge (if applicable)
- Certificate Delivery Charge (₹60 fixed)
- Total amount
- Payment history with dates and modes
- Receipt numbers
- Balance due

**Interconnection:** 
- Fees collected here → Updated in student's fee status
- Payment data visible to Super Admin in Payment Management

---

### 2.7 Reports
**Purpose:** Institute-specific reporting

**Available Reports:**
- Student performance reports
- Exam statistics
- Attendance reports
- Fee collection reports
- Course-wise analytics

---

### 2.8 Staff Management
**Purpose:** Manage faculty and staff

**Add Staff:**
- Name, email, role
- Assign to batches
- Set permissions

**View Staff:**
- Staff list with details
- Assigned batches
- Performance metrics

---

### 2.9 Batch Management
**Purpose:** Organize students into batches

**Create Batch:**
- Batch name
- Course assignment
- Start/End dates
- Assign students

**Manage Batches:**
- Add/Remove students
- Assign faculty
- Set schedules

---

### 2.10 Support
**Purpose:** Raise support tickets to super admin

**Create Ticket:**
- Issue description
- Priority level
- Category

**Track Tickets:**
- View ticket status
- See responses
- Close resolved tickets

---

### 2.11 Settings
**Purpose:** Institute-specific settings and exam timing configuration

**Institute Profile:**
- Institute name, code, location
- Email, phone, address
- Edit profile information

**Exam Systems Management:**
- View total computer systems available
- Add new systems (e.g., System-01, PC-05, LAB-03)
- Remove systems
- System status (Available/Maintenance)
- Grid view of all systems

**Exam Timing Configuration:**
- **Opening Time:** Institute's exam start time (e.g., 09:00)
- **Closing Time:** Institute's exam end time (e.g., 18:00)
- These settings define the institute's operational hours for exams
- Super Admin uses these timings when scheduling exams
- Ensures exams are scheduled within institute's working hours
- Exam duration is set per exam by Super Admin, not institute-wide

**Settings Options:**
- Preferences
- Notifications

---

## 3. STUDENT PANEL

### 3.1 Dashboard
**Purpose:** Student's learning overview

**Metrics Displayed:**
- Enrolled Courses
- Upcoming Exams
- Recent Results
- Pending Assignments
- Notifications

---

### 3.2 Course Access
**Purpose:** View enrolled courses

**Course Details:**
- Course name and code
- Syllabus
- Duration
- Study materials
- Progress tracking
- Books included status

---

### 3.3 Exam Interface

**Access Restrictions:**
- ONLY students can attempt DPPs and Final Exams
- Institute Admin CANNOT attempt any exams
- Super Admin CANNOT attempt any exams
- Exams are exclusively for enrolled students

#### DPP (Daily Practice Papers)
**Purpose:** Practice exams for skill building

**DPP Features:**
- View all available DPPs for enrolled courses
- See question count and duration (30 minutes)
- View total marks
- Start DPP anytime
- Multiple attempts allowed
- Instant results with percentage
- View score after submission

**DPP Attempt:**
- Timer countdown (30 minutes)
- One question at a time
- Select answer from 4 options
- Submit exam
- View score immediately with percentage
- Can re-attempt anytime

#### Final Exams
**Purpose:** Major course examinations

**Final Exam Features:**
- View scheduled final exams
- See exam date, time, duration
- Check attendance status
- Can only attempt if marked present by institute admin
- Single attempt only
- Timed examination
- View system assignment

**Exam Restrictions:**
- Must be marked present by institute admin
- Cannot start before attendance confirmation
- Timer enforced strictly
- Auto-submit on time expiry
- Shows "Waiting for Attendance" if not marked present

**Interconnection:** 
- Exam attempts → Generate results → Visible to institute admin
- Update scoreboards
- Contribute to overall performance metrics

---

### 3.4 Question Bank Practice
**Purpose:** Self-study from question banks

**Practice Features:**
- Browse question banks by course
- Practice questions topic-wise
- View questions with options
- Self-assessment
- Track practice progress

---

### 3.5 Results & Performance
**Purpose:** View exam results and analytics

**Results Display:**
- DPP scores with percentage
- Final exam results
- Question-wise analysis
- Correct/Incorrect breakdown
- Performance trends
- Attempt history

**Scoreboards:**
- DPP rankings (per DPP)
- Course-wise performance
- Compare with peers

---

### 3.6 Admit Cards
**Purpose:** View and download exam admit cards with system allocation details

**Admit Card Display:**
- Separate tab in Exams section
- Shows all admit cards for scheduled final exams
- Cards generated automatically when Super Admin schedules exam
- Beautiful gradient card design (blue to purple)

**Admit Card Details:**
- **Student Information:**
  - Student name
  - Roll number
- **Exam Information:**
  - Exam title
  - Course name
  - Exam date (formatted)
  - Exam time (start - end)
  - Duration in minutes
- **System Allocation:**
  - Allocated computer system name (e.g., System-05, PC-12, LAB-03)
  - Displayed prominently in large blue text
  - Shows exactly which system student should use
- **Section Information:**
  - Section number (for multi-section exams)
  - Badge showing section number
  - Section 999 indicates rescheduled exam
- **Institute Information:**
  - Institute name
- **Rescheduling Status:**
  - If exam is rescheduled, shows yellow alert box
  - Displays rescheduling reason
  - Indicates technical issue or other reason
  - Shows "Rescheduled" badge prominently

**Features:**
- View all admit cards in one place
- No admit cards message if none available
- Hover effects for better UX
- Responsive card layout
- Clear system allocation visibility
- Automatic updates when exam is rescheduled

**Rescheduled Exam Information:**
- Updated admit card with rescheduled status
- Yellow "⚠ Rescheduled" badge prominently displayed
- Yellow alert box showing rescheduling reason
- Updated exam date and time
- New system allocation shown
- Section number 999 for identification
- Admit card remains visible throughout exam lifecycle

**Student Panel Features for Rescheduling:**
- View updated admit card immediately after rescheduling
- See new exam date, time, and system allocation
- Read rescheduling reason provided by Super Admin
- Clear visual indicators of rescheduled status
- Access exam on new scheduled date
- Must wait for attendance to be marked by Institute Admin
- Shows "Waiting for Attendance" screen if not marked present
- Shows countdown timer after attendance marked
- Can attempt exam after start time

**Use Cases:**
- Student knows which system to use before exam
- Prevents confusion on exam day
- Shows section-wise allocation for large batches
- Rescheduled students see updated information with reason
- Students understand why exam was rescheduled
- Clear communication of technical issues

**Interconnection:**
- Admit cards created when Super Admin schedules final exam
- System allocation done automatically based on available systems
- Multi-section exams create multiple admit cards with different times
- Rescheduling creates/updates admit cards automatically
- Student sees updated admit card immediately after rescheduling
- New system allocation reflected in admit card
- Admit cards remain visible throughout (no deletion after attendance)
- Students can reference admit card details anytime

---

### 3.7 Attendance
**Purpose:** View attendance records

**Attendance Display:**
- Exam-wise attendance
- Present/Absent status
- Attendance percentage
- Exam dates

---

### 3.8 Feedback
**Purpose:** Submit course feedback

**Access Restrictions:**
- Feedback forms are ONLY visible to students
- Institute Admin CANNOT see feedback forms
- Institute Admin CANNOT see student responses
- Responses go DIRECTLY to Super Admin only

**Feedback Submission:**
- View available feedback forms (created by Super Admin)
- Answer questions (text/rating/choice)
- Submit responses
- View submission confirmation
- See list of submitted feedback

**Interconnection:** 
- Feedback forms created by Super Admin → Visible ONLY to students
- Feedback submitted here → Goes DIRECTLY to Super Admin
- Institute Admin has NO access to feedback or responses
- Used for course improvement by Super Admin

---

### 3.9 Fee Status
**Purpose:** View fee payment status

**Fee Details:**
- Course-wise fee breakdown
  - Base course fee
  - Exam fee
  - Book price (if included)
  - Delivery charge (if books included)
  - Total amount
- Paid amounts
- Pending dues
- Payment history with:
  - Payment date
  - Amount paid
  - Payment mode
  - Receipt number
  - Course name

**Fee Summary:**
- Total fee across all courses
- Total amount paid
- Total pending amount
- Courses paid count

**Interconnection:** 
- Fee data comes from Institute Admin's fee collection
- Updated in real-time when payments are recorded

---

### 3.10 Notifications
**Purpose:** Receive system updates

**Notification Types:**
- New DPP available
- Final exam scheduled
- Results published
- Fee reminders
- Feedback requests
- Attendance marked

---

### 3.11 Profile Management
**Purpose:** Manage personal information

**Profile Details:**
- Personal information (name, email, roll number)
- Contact details (phone, address)
- Date of birth
- Guardian information (name, phone)
- Enrollment date

**Profile Actions:**
- Edit personal details
- Change password (requires current password)
- Upload documents:
  - Photo
  - ID Proof (Aadhar/PAN/Passport/Driving License)
  - Certificates
- View document upload status

**Digital ID Card:**
- Preview ID card with photo
- Download ID card as image
- Shows: Name, Roll No, Email, Phone, DOB

**Interconnection:** 
- Profile data synced with Institute Admin's student records
- Documents uploaded here visible to institute admin

---

### 3.12 Support
**Purpose:** Raise support queries

**Support Features:**
- Create support ticket
- Track ticket status
- View responses
- Close tickets

---

## SYSTEM INTERCONNECTIONS & WORKFLOW

### Workflow 1: User Creation & Login Flow

**Institute Admin Creation:**
1. **Super Admin** creates Institute Admin user with email and password
2. Institute Admin receives login credentials (email + password)
3. Institute Admin logs in to Institute Admin panel
4. Can now manage their institute's students, courses, fees, and exams

**Student Creation (Method 1 - By Super Admin):**
1. **Super Admin** creates student with all details
2. Assigns institute (course assignment optional)
3. Student receives login credentials
4. Student logs in to Student panel
5. **Note:** Course enrollment is typically done by Institute Admin

**Student Creation (Method 2 - By Institute Admin - PRIMARY METHOD):**
1. **Institute Admin** adds student with details
2. Assigns course from institute's available courses
3. Selects "Include Books" option (affects fee calculation)
4. System generates roll number
5. Student receives login credentials
6. Student logs in to Student panel
7. Student data automatically synced to Super Admin's view
8. **Note:** This is the PRIMARY method for student enrollment

---

### Workflow 2: Course Enrollment & Fee Calculation

1. **Super Admin** creates course with pricing (base fee, exam fee, book price, delivery charge)
2. **Super Admin** assigns course to institute with dates
3. **Institute Admin** sees course in their course list
4. **Institute Admin** adds student and assigns course
5. **Institute Admin** selects "Include Books" (Yes/No)
6. System calculates total fee:
   - If books included: Base Fee + Exam Fee + Book Price + Delivery Charge
   - If books not included: Base Fee + Exam Fee
7. Fee appears in Institute Admin's Fee Management as pending
8. **Student** sees fee breakdown in their Fee Status page

---

### Workflow 3: DPP Creation, Deletion & Attempt

**DPP Creation:**
1. **Super Admin** creates Question Bank for a course with topic and questions
2. **Super Admin** opens "Create DPP" dialog
3. Selects course from dropdown
4. System fetches QBs for that course with `excludeWithDPP=true` filter (only shows QBs without existing DPPs)
5. **Super Admin** selects Question Bank from filtered list
6. DPP title field auto-fills with QB topic name (can be edited)
7. **Super Admin** enters number of questions (max = QB's question count)
8. Clicks "Create DPP"
9. System:
   - Creates ONE DPP for the course (institute-neutral, not per institute)
   - Saves `questionBankId` reference
   - DPP is accessible to ALL students enrolled in that course across ALL institutes
   - Assigns sequential number per course (DPP 1, DPP 2, etc.)
   - Marks QB as "hasDPP: true" to prevent duplicate DPPs
   - Sets 30-minute duration
   - Does NOT create separate DPPs for each institute

**DPP Deletion & QB Reuse:**
1. **Super Admin** deletes a DPP
2. System:
   - Finds linked QB using `questionBankId`
   - Sets QB's `hasDPP` to `false`
   - Deletes associated admit cards
   - Removes DPP from database
3. QB becomes available again in "Create DPP" dropdown
4. **Super Admin** can create new DPP from same QB

**DPP Attempt:**
1. **Student** (from any institute offering that course) sees DPP in exam list (DPP tab)
2. **Student** clicks "Start DPP"
3. **Student** attempts exam with 30-minute timer
4. **Student** submits and gets instant results with percentage
5. **Institute Admin** views scoreboard showing their institute's students only
6. **Student** can re-attempt DPP anytime (multiple attempts allowed)

**Key Points:** 
- One DPP per Question Bank is created globally for the course, not per institute
- All students enrolled in that course (regardless of institute) can attempt the same DPP
- Deleting a DPP makes the QB reusable for new DPP creation
- DPP title can be customized during creation

---

### Workflow 4: Final Exam Process with Attendance

1. **Super Admin** schedules Final Exam with attendance enabled
2. System assigns students to computer systems
3. **Institute Admin** sees exam in Attendance tab
4. **Student** sees exam in Final Exams tab with "Waiting for Attendance" status
5. **Institute Admin** marks students present
6. **Student** can now start exam (button enabled)
7. **Student** completes exam within time limit
8. Results visible to **Institute Admin** and **Student**
9. Admit cards generated for students

---

### Workflow 5: Fee Collection & Accounting Process

1. **Institute Admin** enrolls student with course
2. System calculates total fee based on course pricing and book inclusion
3. Fee appears as pending in Institute Admin's Fee Management
4. **Student** views pending fee in their Fee Status page
5. **Institute Admin** collects fee:
   - Selects student and course
   - Enters amount to collect
   - Selects payment mode
   - Adds remarks (optional)
6. System generates receipt number
7. Payment recorded in Payment model with status "Paid"
8. **System automatically creates Transaction record:**
   - Type: Income
   - Category: Fee Collection
   - Description: "Fee collection from [Institute Name]"
   - Amount: Payment amount
   - Commission: 10% of payment
   - Institute: Linked to payment's institute
   - Date: Payment date
9. **Account Management updates:**
   - Fee Collection stat increases
   - Total Income increases
   - Commission Earned increases
   - Transaction appears in Day Book
10. **Student** sees updated fee status with payment history
11. **Super Admin** sees:
    - Payment in Payment Gateway
    - Transaction in Account Management
    - Updated accounting statistics
12. **Student** can view receipt number and payment details

---

### Workflow 6: Feedback Collection

1. **Super Admin** creates feedback form for course
2. Selects institute and course
3. Adds questions (text/rating/choice)
4. Feedback form becomes visible ONLY to students of that institute/course
5. **Student** sees feedback form in Feedback section
6. **Student** submits feedback responses
7. Responses go DIRECTLY to **Super Admin** (bypassing Institute Admin)
8. **Institute Admin** has NO access to feedback forms or responses
9. **Super Admin** views all responses in Feedback Management
10. Feedback used for course improvement by Super Admin

---

## KEY FEATURES & RESTRICTIONS

### Access Control Matrix

| Feature | Super Admin | Institute Admin | Student |
|---------|-------------|-----------------|----------|
| Create Courses | ✅ Yes | ❌ No | ❌ No |
| View Courses | ✅ All | ✅ Assigned only | ✅ Enrolled only |
| Create Question Banks | ✅ Yes | ❌ No | ❌ No |
| View Question Banks | ✅ All | ✅ Read-only | ✅ For practice |
| Create DPPs | ✅ Yes | ❌ No | ❌ No |
| Attempt DPPs | ❌ No | ❌ No | ✅ Yes |
| Create Final Exams | ✅ Yes | ❌ No | ❌ No |
| Attempt Final Exams | ❌ No | ❌ No | ✅ Yes (if present) |
| Mark Attendance | ❌ No | ✅ Yes | ❌ No |
| Create Students | ✅ Yes | ✅ Yes | ❌ No |
| Enroll Students in Courses | ❌ No | ✅ Yes | ❌ No |
| Collect Fees | ❌ No | ✅ Yes | ❌ No |
| View Fee Status | ✅ All | ✅ Institute only | ✅ Own only |
| Access Account Management | ✅ Yes | ❌ No | ❌ No |
| Create Transactions | ✅ Yes | ❌ No | ❌ No |
| View Accounting Stats | ✅ Yes | ❌ No | ❌ No |
| Create Feedback Forms | ✅ Yes | ❌ No | ❌ No |
| View Feedback Forms | ✅ All | ❌ No | ✅ Assigned only |
| Submit Feedback | ❌ No | ❌ No | ✅ Yes |
| View Feedback Responses | ✅ All | ❌ No | ❌ No |
| View Exam Results | ✅ All | ✅ Institute only | ✅ Own only |
| Create Institutes | ✅ Yes | ❌ No | ❌ No |
| Manage Institute | ✅ All | ✅ Own only | ❌ No |

### Question Bank & DPP Restrictions
- Once a DPP is created from a Question Bank, that QB is marked as "hasDPP: true"
- QBs with existing DPPs are automatically filtered out when creating new DPPs (excludeWithDPP=true parameter)
- This prevents duplicate DPPs from the same question set
- Ensures variety in practice materials
- Super Admin can still view and edit QBs with DPPs, just can't create another DPP from them

**DPP Deletion & QB Reuse:**
- When DPP is deleted, QB's `hasDPP` flag is reset to `false`
- QB becomes available again in DPP creation dropdown
- Allows recreating DPPs from previously used QBs
- System tracks QB-DPP relationship via `questionBankId` field in Exam model
- Deletion automatically updates QB availability in real-time

### Exam Attendance System
- Final exams can have attendance enabled/disabled
- When enabled, students are assigned to specific computer systems
- Students must be marked present by institute admin
- Only present students can attempt the exam
- Attendance tracking helps prevent proxy attempts
- System shows "Waiting for Attendance" message to students not marked present

### Fee Calculation Logic
- Base Fee + Exam Fee = Course Fee
- If books included: Course Fee + Book Price + Delivery Charge = Total Fee
- If books not included: Course Fee = Total Fee
- Institute can have custom pricing (institutePrice field)
- Partial payments allowed
- Receipt number auto-generated for each payment
- Payment history maintained per student per course

### Role-Based Access Control & Restrictions

**Super Admin:**
- Full system access
- Creates: Courses, Question Banks, Exams (DPP/Final), Feedback Forms, Institutes, Users, Transactions
- Views: All data across all institutes, Complete accounting data, Financial statistics
- Manages: Account Management, Fee tracking, Income/Expense transactions
- CANNOT: Attempt exams, Enroll students in courses (only Institute Admin can)

**Institute Admin:**
- Institute-specific management only
- Creates: Students with course enrollment
- Views: Question Banks (read-only), Courses (read-only), Exam results, Student data
- Manages: Fee collection, Attendance marking, Student enrollment
- CANNOT: Create/Edit courses, Create/Edit Question Banks, Create/Edit exams, Attempt exams, View/Create feedback forms, See feedback responses

**Student:**
- Learning interface only
- Can: Attempt exams (DPP multiple times, Final once), View results, Submit feedback, View fee status
- Views: Only their own data, enrolled courses, assigned exams
- CANNOT: See other students' data, Access admin features, Create any content

### Data Hierarchy & Flow
- Courses → Assigned to Institutes → Enrolled by Students
- Question Banks → Used in DPPs/Exams → Attempted by Students
- Exams → Created for Courses → Assigned to Institutes → Attempted by Students
- Fees → Calculated based on Course + Books → Collected by Institute Admin → Visible to Student
- Users → Created by Super Admin or Institute Admin → Login with credentials → Access respective panels

### Login Credentials Flow
- **Super Admin**: Pre-configured system admin account
- **Institute Admin**: Created by Super Admin → Receives email + password → Logs in to Institute Admin panel
- **Student**: Created by Super Admin OR Institute Admin → Receives email + password → Logs in to Student panel
- All users can change their password after first login

### Document Management
- Students can upload: Photo, ID Proof, Certificates
- ID Proof types: Aadhar, PAN, Passport, Driving License
- Documents visible to institute admin
- Digital ID card generated with uploaded photo
- ID card downloadable as image

---

## DPP (DAILY PRACTICE PAPER) LOGIC - DETAILED EXPLANATION

### Core Principle
DPPs are **course-level**, not institute-level. One DPP per Question Bank is created globally for the course.

### DPP Creation Flow

**Step 1: Question Bank Creation**
- Super Admin creates Question Bank for a course
- QB contains topic and multiple questions
- QB has `hasDPP: false` initially

**Step 2: DPP Creation**
- Super Admin selects course and Question Bank
- System checks if QB already has a DPP (`hasDPP: true`)
- If QB has DPP, it's filtered out from selection
- If QB doesn't have DPP, Super Admin can create DPP
- System creates **ONE DPP** for that QB (not per institute)
- DPP is assigned:
  - `courseId`: The course it belongs to
  - `type`: 'DPP'
  - `examNumber`: Sequential number per course (DPP 1, DPP 2, etc.)
  - `questionBankId`: Reference to source QB
  - `instituteId`: **NOT SET** (institute-neutral)
  - `duration`: 30 minutes
  - `status`: 'Active'
- QB is marked as `hasDPP: true`

**Step 3: DPP Accessibility**
- DPP is accessible to **ALL students** enrolled in that course
- Students from **ANY institute** offering that course can attempt
- No institute-specific DPP copies are created

### Why Institute-Neutral?

**Advantages:**
1. **Consistency:** All students practice same questions regardless of institute
2. **Fair Comparison:** Students across institutes can be compared on same DPPs
3. **Efficiency:** No duplicate DPPs for same content
4. **Scalability:** Adding new institutes doesn't require creating new DPPs
5. **Unified Scoreboard:** All students compete on same DPP globally

**Example:**
- Course: Full Stack Web Development
- Question Bank: "React Basics" (50 questions)
- DPP Created: "DPP 1 - React Basics" (20 questions)
- Institutes offering course: Tech Institute Mumbai, Digital Academy Pune, Cyber Institute Bangalore
- Result: **ONE DPP** accessible to students from all 3 institutes

### DPP Numbering Logic

**Per Course Numbering:**
- DPP numbers are sequential **per course**, not global
- Course A: DPP 1, DPP 2, DPP 3...
- Course B: DPP 1, DPP 2, DPP 3... (separate numbering)

**Calculation:**
```javascript
const dppCount = await Exam.countDocuments({ courseId, type: 'DPP' })
const examNumber = dppCount + 1
```

### One DPP Per Question Bank Rule

**Restriction:**
- Each Question Bank can have **ONLY ONE DPP**
- Once DPP is created, QB is marked `hasDPP: true`
- QB with `hasDPP: true` is filtered out from DPP creation
- Prevents duplicate DPPs from same question set

**Filter Logic:**
```javascript
const qbs = await QuestionBank.find({ 
  courseId, 
  hasDPP: false  // Only QBs without DPPs
})
```

### Seeding Data Logic

**Correct Seeding:**
1. Create 5 Question Banks per course (5 topics)
2. Create 1 DPP per Question Bank
3. Total DPPs = Total QBs (5 QBs per course × 7 courses = 35 DPPs)
4. Each DPP is institute-neutral (no `instituteId`)
5. DPP numbering is per course (each course has DPP 1-5)

**Incorrect Seeding (What NOT to do):**
- ❌ Creating DPPs per institute (would create 3× DPPs if 3 institutes)
- ❌ Creating multiple DPPs from same QB
- ❌ Setting `instituteId` on DPPs
- ❌ Global DPP numbering across all courses

### Institute Admin View

**What Institute Admin Sees:**
- All DPPs for courses their institute offers
- Scoreboard showing **only their institute's students**
- Cannot create or edit DPPs
- Cannot attempt DPPs

**Scoreboard Filtering:**
```javascript
// Institute Admin sees only their students
const results = await ExamResult.find({ examId: dppId })
  .populate({
    path: 'studentId',
    match: { instituteId: adminInstituteId }  // Filter by institute
  })
```

### Student View

**What Student Sees:**
- All DPPs for their enrolled courses
- Can attempt any DPP multiple times
- Sees their own results and rank
- Competes with students from all institutes on same DPP

### Summary

| Aspect | Logic |
|--------|-------|
| DPPs per QB | Exactly ONE |
| DPPs per Institute | N/A (institute-neutral) |
| DPP Accessibility | All students of that course (any institute) |
| DPP Numbering | Sequential per course |
| QB Reuse | Not allowed after DPP creation |
| Institute Admin Access | View only (their students' results) |
| Student Access | Attempt multiple times |

---

## SUMMARY

This LMS provides a complete educational ecosystem where:

**Super Admins** control the entire system infrastructure:
- Create and manage institutes
- Create courses with pricing
- Create users (institute admins, students, faculty)
- Create question banks and exams
- Monitor payments and generate reports
- Manage complete accounting system with income/expense tracking
- Track fee collections with automatic commission calculation
- Create manual transactions for expenses
- Filter and analyze financial data
- Handle support tickets

**Institute Admins** manage day-to-day operations:
- Add and manage students
- Collect fees and track payments
- Mark attendance for exams
- View exam results and scoreboards
- Manage courses assigned to their institute
- Raise support tickets

**Students** focus on learning and examinations:
- Access enrolled courses
- Attempt DPPs (multiple times) and Final Exams (once)
- View results and performance
- Check fee status and payment history
- Submit feedback
- Manage profile and documents
- Download admit cards and ID cards

The system ensures data integrity through proper interconnections, prevents duplicate content through smart restrictions (QB-DPP mapping), maintains security through role-based access control, and provides seamless fee management with automatic calculations and receipt generation. All three panels work together to provide a comprehensive learning management experience with complete transparency in fees, exams, and performance tracking.
