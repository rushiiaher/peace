# Exam Reschedule and Configuration Fixes

## Issues Fixed

### 1. "No Systems Available" Error During Exam Rescheduling

**Problem**: When rescheduling exams in the Super Admin panel, the system showed "No systems available" even when systems existed at the institute.

**Root Cause**: The code was filtering systems using only `status === 'Available'`, but many institutes mark their systems with status `'Active'` instead.

**Solution**: Updated all exam scheduling and rescheduling routes to accept both statuses:
```typescript
// Before
const availableSystems = institute.systems.filter((s: any) => s.status === 'Available')

// After  
const availableSystems = institute.systems.filter((s: any) => 
    s.status === 'Available' || s.status === 'Active'
)
```

**Files Modified**:
- ✅ `app/api/exams/allocate-systems/route.ts`
- ✅ `app/api/exams/reschedule-approve/route.ts`
- ✅ `app/api/exams/bulk-reschedule/route.ts`

### 2. Hardcoded 180-Minute Exam Duration

**Problem**: Exam duration was hardcoded to 180 minutes instead of using the duration configured in the Course Management by Super Admin.

**Root Cause**: The exam scheduling logic defaulted to `sectionDuration = 180` without checking the course's `examConfigurations` array first.

**Course Model Structure**:
The Course model has an `examConfigurations` field that contains:
- `duration` (in minutes)
- `totalQuestions`
- `questionBanks` (references to question banks)

**Solution**: Updated all exam routes to:
1. Fetch the course details
2. Extract the exam configuration (uses first configuration if multiple exist)
3. Use the course's configured duration with 180 as fallback

```typescript
// Fetch course for exam configuration
const course = await Course.findById(courseId)
const examConfig = course?.examConfigurations?.[0]
const courseExamDuration = examConfig?.duration || null

// Use course duration with fallback to 180
const { openingTime = '09:00', closingTime = '18:00', 
        sectionDuration = courseExamDuration || 180, 
        breakBetweenSections = 30, workingDays = [1,2,3,4,5,6] 
} = institute.examTimings || {}
```

**Files Modified**:
- ✅ `app/api/exams/allocate-systems/route.ts`
- ✅ `app/api/exams/reschedule-approve/route.ts`  
- ✅ `app/api/exams/bulk-reschedule/route.ts`

## How Exam Configuration Works Now

### Flow:
1. **Super Admin creates/edits a course** → Sets `examConfigurations` with duration
2. **Super Admin/Institute Admin schedules exam** → System fetches course → Uses configured duration
3. **Exam is created** → Duration is pulled from course configuration
4. **Admit cards are generated** → Duration from exam is used
5. **Student takes exam** → Timer uses the configured duration

### Priority Order for Exam Duration:
1. ✅ Course `examConfigurations[0].duration` (from Course Management)
2. ✅ Institute `examTimings.sectionDuration` (if set)
3. ✅ Fallback to 180 minutes (default)

## Testing Recommendations

### Test Case 1: System Availability
1. Go to Institute Settings
2. Mark systems with status "Active" (not "Available")
3. Try to schedule an exam or approve a reschedule request
4. **Expected**: Should find systems and schedule successfully

### Test Case 2: Course Exam Duration
1. **Super Admin Panel** → Courses → Edit a course
2. Set `examConfigurations` with custom duration (e.g., 120 minutes)
3. **Super Admin Panel** → Exams → Schedule a new exam for that course
4. **Expected**: 
   - Exam should be created with 120-minute duration
   - Admit cards should show 120 minutes
   - Student exam timer should be 120 minutes

### Test Case 3: Reschedule with Course Configuration
1. Create an exam with a course that has custom duration
2. Have students miss the exam
3. Reschedule those students
4. **Expected**:
   - Rescheduled exam uses the same duration from course config
   - Systems marked as "Active" are available for allocation

## Technical Details

### System Status Accepted:
- ✅ `'Available'`
- ✅ `'Active'`

Not accepted (correct behavior):
- ❌ `'Offline'`
- ❌ `'Under Maintenance'`
- ❌ Any other status

### Exam Configuration Structure:
```typescript
// In Course model
examConfigurations: [{
    examNumber: Number,      // Which exam (1, 2, 3, etc.)
    duration: Number,        // Duration in MINUTES
    totalQuestions: Number,  // Total questions for this exam
    questionBanks: [ObjectId] // References to QuestionBank
}]
```

### Important Notes:
- If a course has multiple exam configurations, the system uses the FIRST one (`[0]`)
- If no exam configuration exists, falls back to institute settings or 180 default
- All durations are in **minutes**, not hours

## Files Modified Summary

| File | Changes |
|------|---------|
| `app/api/exams/allocate-systems/route.ts` | ✅ Course config fetch<br>✅ Active systems accepted<br>✅ Removed duplicate course fetch |
| `app/api/exams/reschedule-approve/route.ts` | ✅ Course config fetch<br>✅ Active systems accepted<br>✅ Added Course import |
| `app/api/exams/bulk-reschedule/route.ts` | ✅ Course config fetch<br>✅ Active systems accepted |

## Related Models

- **Course** (`lib/models/Course.ts`) - Contains exam configurations
- **Institute** (`lib/models/Institute.ts`) - Contains exam timings and systems
- **Exam** (`lib/models/Exam.ts`) - Stores duration from configuration
- **AdmitCard** (`lib/models/AdmitCard.ts`) - Shows duration on admit cards
