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

  // Data payload for client-side rendering
  const certData = JSON.stringify({
    ...data,
    maskedAadhaar,
    totalInWords,
    resultColor,
    gradeColor
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Provisional Marksheet - ${data.candidateName}</title>
  <style>
    /* A4 format settings */
    body { margin: 0; padding: 0; display: flex; justify-content: center; background: #555; overflow: hidden; }
    
    canvas { 
      background: white; 
      box-shadow: 0 0 10px rgba(0,0,0,0.5); 
      max-width: 100%; 
      height: auto;
    }

    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body { background: none; display: block; margin: 0; padding: 0; }
      canvas { box-shadow: none; width: 100%; height: 100%; max-width: none; display: block; }
    }
  </style>
</head>
<body>
  <canvas id="certCanvas"></canvas>

  <script>
    const data = ${certData};
    const canvas = document.getElementById('certCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = '/Provisional-JPG-JPEG-BLANK.jpg';
    
    // COORDINATE ADJUSTMENTS BASED ON USER FEEDBACK:
    // 1. Cand Details: leftwards (shifted x to 70), downwards (increased y step)
    // 2. Roll No: Left and Down
    // 3. Final Exam: y down, Text change
    // 4. Internal assessed: Rightwards, tiny up, smaller font, less gap
    // 5. Result: Too much left
    // 6. Grade: Left and Up, Smaller font
    // 7. Grand total: Rightwards and Up
    // 8. UID: Right and TOO UP
    // 9. Date: UP and LEFT TOO MUCH

    const coords = {
      rollNo: { x: 165, y: 91 },
      candidateName: { x: 70, y: 96 },
      motherName: { x: 70, y: 107 }, 
      courseCode: { x: 70, y: 118 }, 
      courseName: { x: 70, y: 129 }, 
      examCenter: { x: 70, y: 140 }, 
      
      finalTitle: { x: 20, y: 156 },
      finalMarks: { x: 87, y: 156 }, 
      finalMax: { x: 115, y: 156 }, 
      finalResult: { x: 145, y: 168 }, // Too much left & slight down
      
      totalMarks: { x: 93, y: 189 }, // Right and Up
      totalMax: { x: 121, y: 189 }, // Right and Up
      grade: { x: 150, y: 189 }, // Up and Left
      words: { x: 85, y: 196 }, // Too Right and Little Up
      uid: { x: 80, y: 208 }, // Right and TOO UP
      date: { x: 155, y: 250 } // UP and LEFT too much
    };

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const scale = canvas.width / 210; 

      const draw = (text, x_mm, y_mm, size_pt = 12, color = '#d32f2f', align = 'left', weight = 'bold', maxWidth_mm = 0) => {
        const sizePx = size_pt * 0.352 * scale;
        ctx.font = \`\${weight} \${sizePx}px "Times New Roman", serif\`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        const x = x_mm * scale;
        const y = y_mm * scale;
        
        if (maxWidth_mm > 0) {
           ctx.fillText(text, x, y, maxWidth_mm * scale);
        } else {
           ctx.fillText(text, x, y);
        }
      };

      // 1. Roll No
      draw(data.rollNo, coords.rollNo.x, coords.rollNo.y, 14, '#d32f2f', 'left');
      
      // 2. Candidate Details
      draw(data.candidateName, coords.candidateName.x, coords.candidateName.y, 13);
      draw(data.motherName, coords.motherName.x, coords.motherName.y, 13);
      draw(data.courseCode, coords.courseCode.x, coords.courseCode.y, 13);
      draw(data.courseName, coords.courseName.x, coords.courseName.y, 13);
      draw(data.examCenter, coords.examCenter.x, coords.examCenter.y, 13);

      // 3. Final Exam (Text: Final exam)
      draw("Final exam", coords.finalTitle.x, coords.finalTitle.y, 9, '#000000', 'left', 'bold', 60);
      draw(data.finalExamMarks, coords.finalMarks.x, coords.finalMarks.y, 13, '#d32f2f', 'center');
      draw(data.finalExamMaxMarks, coords.finalMax.x, coords.finalMax.y, 13, '#000000', 'center');
      draw(data.result, coords.finalResult.x, coords.finalResult.y, 20, data.resultColor, 'center');

      // 4. Internal Assessment (Smaller font, Rightwards, Little up, reduced gap)
      data.evaluationComponents.slice(0, 4).forEach((comp, i) => {
        const yBase = 171 + (i * 6); // Tiny up, gap reduced to 6mm
        draw(comp.name, 35, yBase, 9, '#000000', 'left'); // Rightwards
        draw(comp.marksObtained, 93, yBase, 9, '#d32f2f', 'center'); // Rightwards
        draw(comp.maxMarks, 121, yBase, 9, '#000000', 'center'); // Rightwards
      });

      // 5. Grand Total
      draw(data.totalMarks, coords.totalMarks.x, coords.totalMarks.y, 14, '#d32f2f', 'center');
      draw(data.totalMaxMarks, coords.totalMax.x, coords.totalMax.y, 14, '#000000', 'center');
      draw(data.grade, coords.grade.x, coords.grade.y, 13, data.gradeColor, 'left');

      // 6. Words (Too Right)
      draw(data.totalInWords, coords.words.x, coords.words.y, 10, '#d32f2f', 'left');

      // 7. UID (Right and TOO UP)
      // Ensure digits are drawn
      draw(data.maskedAadhaar, coords.uid.x, coords.uid.y, 12, '#d32f2f', 'left');
      
      // 8. Date (UP and LEFT TOO MUCH)
      draw(data.issueDate, coords.date.x, coords.date.y, 12, '#d32f2f', 'left');

      setTimeout(() => window.print(), 500);
    };
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
