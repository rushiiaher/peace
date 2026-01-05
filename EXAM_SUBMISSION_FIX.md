# Exam Auto-Submission Bug Fix

## Issue Description
exams were occasionally auto-submitting when users interacted with "Clear Response" or "Next" buttons, or when selecting options.

## Root Cause
The navigation buttons ("Previous", "Clear Response", "Next", "Mark for Review") and the Question Palette buttons were implemented using the `<Button>` component or raw `<button>` tag without an explicit `type` attribute.

In HTML/React, a button without a type defaults to `type="submit"`. Although there was no visible `<form>` tag wrapping the entire exam interface, some browsers or surrounding contexts may treat these buttons as submit triggers, especially when triggered via keyboard interactions (Enter key) or specific event propagations.

## Fix Applied
Explicitly added `type="button"` to all interactive buttons in the exam interface:

1. **Navigation Buttons**:
   - Previous
   - Clear Response
   - Next
   - Submit Exam (also explicit now)

2. **Utility Buttons**:
   - Mark for Review
   - Enter Full Screen Mode
   - Question Palette numbers

## Files Modified
- `app/(lms)/student/exams/[id]/page.tsx`

## Testing Instructions
1. **Clear Response Test**: 
   - Select an answer
   - Click "Clear Response"
   - Verify answer clears and exam DOES NOT submit

2. **Navigation Test**:
   - Click Next/Previous rapidly
   - Verify navigation works without submitting

3. **Keyboard Test**:
   - Focus on various buttons and press Enter
   - Verify they perform their specific action and do not submit the exam

4. **Submission Test**:
   - Click the actual "Submit Exam" button
   - Verify it still works correctly
