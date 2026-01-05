# Student Photo Upload and Display Fixes

## Issues Fixed

### 1. Student Photos Not Displaying on Exam Window
**Problem**: When students took exams, their photos were not displaying in the student ID card section on the exam page.

**Root Cause**: The login API was only returning limited user information (id, email, name, role, instituteId) to be stored in localStorage. The `documents` field containing the student photo was not included.

**Solution**: 
- **File**: `app/api/auth/login/route.ts`
- Updated the login response to include additional student fields:
  - `rollNo`
  - `firstName`, `middleName`, `lastName`
  - `documents` (which contains the photo)

This ensures that when a student logs in, their complete profile information including photo is available client-side.

### 2. Exam Page Fallback for Student Photos
**Problem**: Even after the login fix, existing sessions might not have the photo data in localStorage.

**Solution**:
- **File**: `app/(lms)/student/exams/[id]/page.tsx`
- Added an automatic API fallback in the exam page that:
  - Checks if student photo exists in localStorage
  - If not, fetches fresh user data from the API (`/api/users/[id]`)
  - Updates both the component state and localStorage with complete data
  - Ensures photos always display, even for existing sessions

### 3. Image Type Acceptance and Validation
**Problem**: Users may have been experiencing issues uploading various image formats, or getting unclear feedback.

**Solution**:
- **File**: `components/lms/forms/student-form.tsx`
- Enhanced the photo upload handler with:
  - **File Size Validation**: Maximum 5MB file size limit with clear error message
  - **File Type Validation**: Validates against allowed types (JPEG, JPG, PNG, GIF, WebP, BMP, SVG)
  - **Success Feedback**: Toast notification when photo is successfully uploaded
  - **Error Handling**: Clear error messages for:
    - Files that are too large
    - Invalid file types
    - File read errors
  - **Updated Help Text**: Changed from "JPG, PNG, GIF, WebP" to "JPG, JPEG, PNG, GIF, WebP, BMP, SVG" to accurately reflect all supported formats

## Supported Image Formats

The system now explicitly supports and validates the following image formats:
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)
- **BMP** (.bmp)
- **SVG** (.svg)

Maximum file size: **5MB**

## Testing Recommendations

1. **Test Student Creation**:
   - Try uploading photos in different formats (JPG, PNG, GIF, WebP, etc.)
   - Test with files larger than 5MB to verify size validation
   - Test with non-image files to verify type validation

2. **Test Photo Display on Exam**:
   - Create a student with a photo
   - Log in as that student
   - Start an exam and verify the photo displays in the student ID card
   - Test with different browsers to ensure localStorage works correctly

3. **Test Existing Sessions**:
   - For students who were already logged in before this fix
   - Navigate to an exam page
   - Verify that the photo loads via the API fallback mechanism

## Technical Details

### Data Flow:

1. **Student Creation/Edit**:
   ```
   User selects image → File validated (size & type) → 
   FileReader converts to base64 → Stored in User.documents.photo
   ```

2. **Login**:
   ```
   User logs in → API returns user object with documents field →
   Stored in localStorage('user')
   ```

3. **Exam Page Display**:
   ```
   Page loads → Reads localStorage →
   If photo exists: Display it
   If photo missing: Fetch from API → Update localStorage → Display it
   ```

## Files Modified

1. `app/api/auth/login/route.ts` - Login response enhancement
2. `app/(lms)/student/exams/[id]/page.tsx` - API fallback for photos
3. `components/lms/forms/student-form.tsx` - Image validation and feedback

## Code Review Notes

- All changes are backward compatible
- No database schema changes required
- The API fallback ensures photos work even for existing sessions
- File size limit (5MB) should be sufficient for passport-style photos
- Toast notifications provide clear user feedback
