// Utility to calculate grade based on percentage
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 91) return 'A+'
  if (percentage >= 81) return 'A'
  if (percentage >= 71) return 'B+'
  if (percentage >= 61) return 'B'
  if (percentage >= 51) return 'C+'
  if (percentage >= 41) return 'C'
  if (percentage >= 40) return 'D'
  return 'FAIL'
}

// Convert number to words (for Grand Total in words)
export const numberToWords = (num: number): string => {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']

  if (num === 0) return 'ZERO'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
  if (num < 1000) {
    return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '')
  }
  return num.toString() // fallback for large numbers
}

// Mask Aadhaar number (show only last 4 digits)
export const maskAadhaar = (aadhaar: string): string => {
  if (!aadhaar) return 'XXXX XXXX XXXX'
  const cleaned = aadhaar.replace(/\s/g, '')
  if (cleaned.length < 4) return 'XXXX XXXX ' + cleaned
  const lastFour = cleaned.slice(-4)
  return `XXXX XXXX ${lastFour}`
}

interface EvaluationComponent {
  name: string
  marksObtained: number
  maxMarks: number
  result?: string
}

interface ProvisionalCertificateData {
  candidateName: string
  motherName: string
  courseCode: string
  courseName: string
  examCenter: string
  rollNo: string
  aadhaarNo: string
  evaluationComponents: EvaluationComponent[]
  finalExamMarks: number
  finalExamMaxMarks: number
  finalExamQuestions: number
  finalExamCorrect: number
  totalMarks: number
  totalMaxMarks: number
  percentage: number
  grade: string
  result: 'PASS' | 'FAIL'
  issueDate: string
}

export const generateProvisionalCertificateHtml = (data: ProvisionalCertificateData) => {
  const maskedAadhaar = maskAadhaar(data.aadhaarNo)
  const totalInWords = numberToWords(data.totalMarks)
  const resultColor = data.result === 'PASS' ? '#28a745' : '#dc3545'
  const gradeColor = data.result === 'PASS' ? '#d32f2f' : '#dc3545'

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Provisional Marksheet - ${data.candidateName}</title>
  <style>
    @page { size: A4; margin: 0; }
    body { 
      font-family: 'Times New Roman', serif; 
      margin: 0; padding: 0;
      width: 210mm; height: 297mm;
      position: relative;
    }
    .bg-img {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
    }
    .absolute-text {
      position: absolute;
      color: #d32f2f;
      font-weight: bold;
      font-size: 13px; /* Slightly smaller for better fit */
      text-transform: uppercase;
    }
    .roll-no { top: 84mm; left: 172mm; font-size: 14px; } /* Aligned right of label */
    
    /* Candidate Info - Shifted Up */
    .lbl-cand { top: 96mm; left: 80mm; }
    .lbl-moth { top: 103mm; left: 80mm; }
    .lbl-code { top: 110mm; left: 80mm; }
    .lbl-name { top: 117mm; left: 80mm; }
    .lbl-center { top: 124mm; left: 80mm; }

    /* Final Exam Row */
    .row-final-title { top: 150mm; left: 20mm; font-size: 11px; color: #000; width: 75mm; line-height: 1.1; }
    .row-final-marks { top: 150mm; left: 82mm; text-align: center; width: 20mm; } /* Adjusted Left */
    .row-final-max { top: 150mm; left: 110mm; text-align: center; width: 20mm; color: #000; } /* Adjusted Left */
    .row-final-result { top: 162mm; left: 140mm; text-align: center; width: 50mm; font-size: 20px; } /* Vertically centered in wide box */

    /* Grand Total Numbers */
    .row-total-marks { top: 193mm; left: 82mm; text-align: center; width: 20mm; font-size: 15px; } /* Moved Up */
    .row-total-max { top: 193mm; left: 110mm; text-align: center; width: 20mm; color: #000; font-size: 15px; } /* Moved Up */
    .row-grade { top: 193mm; left: 155mm; font-size: 16px; } /* Moved Up */

    /* Grand Total Words */
    .row-words { top: 200mm; left: 65mm; color: #d32f2f; font-size: 11px; font-weight: bold; } /* Correctly in last row */

    /* UID & Date */
    .uid-val { top: 210mm; left: 45mm; font-size: 12px; } /* Aligned with UID NO label */
    .date-val { bottom: 38mm; left: 170mm; font-size: 12px; }

  </style>
</head>
<body>
  <img src="/Provisional-JPG-JPEG-BLANK.jpg" class="bg-img" />

  <!-- Roll No -->
  <div class="absolute-text roll-no">${data.rollNo}</div>

  <!-- Candidate Details -->
  <div class="absolute-text lbl-cand">${data.candidateName}</div>
  <div class="absolute-text lbl-moth">${data.motherName}</div>
  <div class="absolute-text lbl-code">${data.courseCode}</div>
  <div class="absolute-text lbl-name">${data.courseName}</div>
  <div class="absolute-text lbl-center">${data.examCenter}</div>

  <!-- Final Exam -->
  <div class="absolute-text row-final-title">${data.courseName}-Online</div>
  <div class="absolute-text row-final-marks">${data.finalExamMarks}</div>
  <div class="absolute-text row-final-max">${data.finalExamMaxMarks}</div>
  <div class="absolute-text row-final-result" style="color: ${resultColor}">${data.result}</div>

  <!-- Internals (Loop) -->
  ${data.evaluationComponents.slice(0, 4).map((comp, i) => `
    <div class="absolute-text" style="top: ${171 + (i * 7)}mm; left: 30mm; font-size: 11px; color: #000; width: 60mm;">${comp.name}</div>
    <div class="absolute-text" style="top: ${171 + (i * 7)}mm; left: 82mm; text-align: center; width: 20mm;">${comp.marksObtained}</div>
    <div class="absolute-text" style="top: ${171 + (i * 7)}mm; left: 110mm; text-align: center; width: 20mm; color: #000;">${comp.maxMarks}</div>
  `).join('')}

  <!-- Grand Total -->
  <div class="absolute-text row-total-marks">${data.totalMarks}</div>
  <div class="absolute-text row-total-max">${data.totalMaxMarks}</div>
  <div class="absolute-text row-grade" style="color: ${gradeColor}">${data.grade}</div>

  <div class="absolute-text row-words">${totalInWords}</div>

  <div class="absolute-text uid-val">${maskedAadhaar}</div>
  <div class="absolute-text date-val">${data.issueDate}</div>
  
  <script>
    window.onload = function() { setTimeout(() => window.print(), 500); }
  </script>
</body>
</html>
  `
}

// Calculate pass/fail based on requirements
export const calculateResult = (
  finalExamCorrect: number,
  totalMarks: number,
  totalMaxMarks: number
): 'PASS' | 'FAIL' => {
  // Must get 35+ questions correct in final exam (70+ marks)
  const finalExamPass = finalExamCorrect >= 35

  // Must get 40%+ overall
  const percentage = (totalMarks / totalMaxMarks) * 100
  const overallPass = percentage >= 40

  return finalExamPass && overallPass ? 'PASS' : 'FAIL'
}
