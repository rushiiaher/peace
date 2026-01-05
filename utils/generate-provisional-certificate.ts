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

  // Determine result color
  const resultColor = data.result === 'PASS' ? '#28a745' : '#dc3545'
  const gradeColor = data.result === 'PASS' ? '#d32f2f' : '#dc3545'

  // Generate evaluation rows (max 4 components)
  const evalRows = data.evaluationComponents.slice(0, 4).map(comp => `
    <tr>
      <td style="padding: 8px; text-align: left; font-size: 14px;">${comp.name}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold; color: #d32f2f; font-size: 14px;">${comp.marksObtained}</td>
      <td style="padding: 8px; text-align: center; font-size: 14px;">${comp.maxMarks}</td>
      <td style="padding: 8px; text-align: center; font-size: 14px;" rowspan="${data.evaluationComponents.length + 2}">
        <strong style="color: ${resultColor}; font-size: 18px;">${data.result}</strong>
      </td>
    </tr>
  `).join('')

  // Check if final exam passed (35+ questions correct)
  const finalExamResult = data.finalExamCorrect >= 35 ? 'PASS' : 'FAIL'
  const finalExamColor = finalExamResult === 'PASS' ? '#28a745' : '#dc3545'

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Provisional Marksheet - ${data.candidateName}</title>
  <style>
    @page { size: A4; margin: 0; }
    body { 
      font-family: 'Times New Roman', serif; 
      margin: 0; 
      padding: 0;
      background: url('/Provisional-PNG.png') no-repeat center center;
      background-size: contain;
      width: 210mm;
      height: 297mm;
      position: relative;
    }
    .content {
      position: absolute;
      width: 100%;
      height: 100%;
      padding: 85mm 20mm 20mm 20mm;
      box-sizing: border-box;
    }
    .field {
      font-size: 14px;
      color: #d32f2f;
      font-weight: bold;
      text-transform: uppercase;
    }
    .roll-no {
      position: absolute;
      top: 82mm;
      right: 25mm;
      font-size: 15px;
      color: #d32f2f;
      font-weight: bold;
    }
    .info-table {
      width: 100%;
      margin-top: 8mm;
      margin-bottom: 5mm;
    }
    .info-row {
      display: flex;
      margin-bottom: 3mm;
    }
    .info-label {
      width: 35mm;
      font-size: 13px;
      color: #000;
    }
    .info-value {
      flex: 1;
      font-size: 14px;
      color: #d32f2f;
      font-weight: bold;
      text-transform: uppercase;
    }
    .marks-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5mm;
      margin-bottom: 5mm;
    }
    .marks-table th {
      background-color: transparent ;
      padding: 8px;
      border: 1px solid #000;
      font-size: 13px;
      text-align: center;
    }
    .marks-table td {
      border: 1px solid #000;
      padding: 8px;
      font-size: 14px;
    }
    .total-row {
      background-color: transparent;
      font-weight: bold;
    }
    .uid {
      margin-top: 5mm;
      font-size: 14px;
    }
    .uid-label {
      color: #000;
    }
    .uid-value {
      color: #d32f2f;
      font-weight: bold;
    }
    .date-footer {
      position: absolute;
      bottom: 35mm;
      right: 25mm;
      font-size: 12px;
      color: #d32f2f;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="content">
    <!-- Roll Number (Top Right) -->
    <div class="roll-no">Roll No: ${data.rollNo}</div>
    
    <!-- Student Information -->
    <div class="info-table">
      <div class="info-row">
        <div class="info-label">Candidate Name</div>
        <div class="info-value">: ${data.candidateName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Mother's Name</div>
        <div class="info-value">: ${data.motherName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Course Code</div>
        <div class="info-value">: ${data.courseCode}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Course Name</div>
        <div class="info-value">: ${data.courseName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Exam Center</div>
        <div class="info-value">: ${data.examCenter}</div>
      </div>
    </div>

    <!-- Marks Table -->
    <table class="marks-table">
      <thead>
        <tr>
          <th style="width: 40%;">Exam Title</th>
          <th style="width: 20%;">Marks</th>
          <th style="width: 20%;">Marks Out Of</th>
          <th style="width: 20%;">Result</th>
        </tr>
      </thead>
      <tbody>
        <!-- Final Exam Row -->
        <tr>
          <td style="padding: 8px; text-align: left; font-size: 14px; font-weight: bold;">${data.courseName}-Online</td>
          <td style="padding: 8px; text-align: center; font-weight: bold; color: #d32f2f; font-size: 14px;">${data.finalExamMarks}</td>
          <td style="padding: 8px; text-align: center; font-size: 14px;">${data.finalExamMaxMarks}</td>
          <td style="padding: 8px; text-align: center; font-size: 14px; color: ${finalExamColor};" rowspan="${data.evaluationComponents.length + 2}">
            <strong style="font-size: 18px;">${data.result}</strong>
          </td>
        </tr>
        
        <!-- Internal Assessment Header -->
        <tr>
          <td colspan="3" style="padding: 8px; text-align: center; font-weight: bold; background-color: transparent; font-size: 13px;">
            Internal Assessment
          </td>
        </tr>
        
        <!-- Evaluation Components -->
        ${data.evaluationComponents.slice(0, 4).map((comp, idx) => `
        <tr>
          <td style="padding: 8px; text-align: left; font-size: 14px; padding-left: 24px;">${comp.name}</td>
          <td style="padding: 8px; text-align: center; font-weight: bold; color: #d32f2f; font-size: 14px;">${comp.marksObtained}</td>
          <td style="padding: 8px; text-align: center; font-size: 14px;">${comp.maxMarks}</td>
        </tr>
        `).join('')}
        
        <!-- Grand Total Row -->
        <tr class="total-row">
          <td style="padding: 10px; text-align: left; font-size: 15px; font-weight: bold;">Grand Total</td>
          <td style="padding: 10px; text-align: center; font-size: 16px; font-weight: bold; color: #d32f2f;">${data.totalMarks}</td>
          <td style="padding: 10px; text-align: center; font-size: 15px; font-weight: bold;">${data.totalMaxMarks}</td>
          <td style="padding: 10px; text-align: center; font-size: 14px;">Grade: <span style="color: ${gradeColor}; font-size: 18px; font-weight: bold;">${data.grade}</span></td>
        </tr>
        
        <!-- Total in Words -->
        <tr>
          <td colspan="4" style="padding: 8px; text-align: left; font-size: 13px;">
            Grand Total in words: <strong style="color: #d32f2f; font-size: 14px;">${totalInWords}</strong>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- UID (Aadhaar) -->
    <div class="uid">
      <span class="uid-label">UID NO:</span>
      <span class="uid-value">${maskedAadhaar}</span>
    </div>

    <!-- Date Footer -->
    <div class="date-footer">
      Date: ${data.issueDate}
    </div>
  </div>
  
  <script>
    window.onload = function() { 
      setTimeout(() => window.print(), 500); 
    }
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
