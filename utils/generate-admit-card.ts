
interface AdmitCardData {
    instituteName: string;
    instituteCode?: string;
    instituteAddress?: string;
    candidateName: string;
    photoUrl?: string; // Optional
    systemName: string;
    rollNo: string;
    studentName: string;
    motherName: string;
    aadhaarCard: string;
    examCentreCode: string; // e.g., DLC-IT1081
    batch: string; // "Batch-04"
    examDate: string;
    reportingTime: string; // 30 mins before
    gateClosingTime: string; // 20 mins before? Or 5 mins before
    examStartTime: string;
    examDuration: string; // "60 Minutes"
    examCentreName: string;
    examCentreAddress: string;
}

export const generateAdmitCardHtml = (data: AdmitCardData) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Candidate Admit Card - ${data.candidateName}</title>
    <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 5px; }
        
        .header { text-align: center; margin-bottom: 5px; position: relative; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .header h3 { margin: 5px 0; font-size: 12px; font-weight: normal; }
        .header h2 { margin: 10px 0 5px 0; font-size: 18px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
        
        .photo-box {
            position: absolute;
            top: 0;
            right: 0;
            width: 120px;
            height: 140px;
            border: 1px solid #000;
            overflow: hidden;
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .candidate-name { text-align: center; font-size: 14px; margin-bottom: 20px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 6px 10px; text-align: left; vertical-align: middle; }
        
        .label { font-weight: bold; width: 20%; background-color: #f9f9f9; }
        .value { font-weight: bold; text-transform: uppercase; }

        .batch-header { text-align: center; font-weight: bold; font-size: 16px; margin: 15px 0 5px 0; text-transform: uppercase; }

        .instructions { font-size: 12px; line-height: 1.5; padding: 10px; border: 1px solid #000; margin-top: 10px; }
        .instructions h4 { margin: 0 0 5px 0; text-decoration: underline; }
        
        .footer { display: flex; justify-content: space-between; margin-top: 50px; font-weight: bold; font-size: 14px; padding: 0 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Logo -->
            <!-- Logo -->
            <img src="/Peacexperts_LOGO.png" alt="PEACE Logo" style="height: 80px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
            <!-- <div style="margin-bottom: 10px; font-size: 40px; font-weight: bold; color: #333;">PEACE</div> --> 
            <h1>${data.instituteName}</h1>
            <h3>Reg. Under Ministry of Corporate Affairs (Govt. of India)</h3>
            <h3>PEACEXPERTS ACADEMY-MH2022PTC376485 & An ISO:9001:2015 Certified</h3>
            
            <h2>CANDIDATE ADMIT CARD</h2>
            
            <div class="photo-box">
                ${data.photoUrl ? `<img src="${data.photoUrl}" alt="Photo" />` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;">PHOTO</div>'}
            </div>
        </div>

        <div class="candidate-name">
            Name of the Candidate ( As Filled By the Candidate In Institute Window)
        </div>

        <table>
            <tr>
                <td class="label">Allocated System</td>
                <td class="value" style="width: 30%;">${data.systemName}</td>
                <td class="label">Roll No.</td>
                <td class="value">${data.rollNo}</td>
            </tr>
            <tr>
                <td class="label">Student Name</td>
                <td class="value" colspan="3">${data.studentName}</td>
            </tr>
            <tr>
                <td class="label">Mother's Name</td>
                <td class="value">${data.motherName}</td>
                <td class="label">Addhar Card</td>
                <td class="value">${data.aadhaarCard}</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align: center; font-weight: bold; padding: 4px; font-size: 12px;">
                    VALID FOR — EXAMINATION ONLY
                </td>
            </tr>
        </table>

        <div class="batch-header">BATCH SCHEDULE</div>

        <table>
            <tr>
                <td class="label">Exam Centre Code</td>
                <td class="value">${data.examCentreCode}</td>
                <td class="label">Exam Date</td>
                <td class="value">${data.examDate}</td>
            </tr>
            <tr>
                <td class="label">Batch</td>
                <td class="value">${data.batch}</td>
                <td class="label">Reporting Time</td>
                <td class="value">${data.reportingTime}</td>
            </tr>
            <tr>
                <td class="label">Gate Closing Time</td>
                <td class="value">${data.gateClosingTime}</td>
                <td class="label">Exam Start Time</td>
                <td class="value">${data.examStartTime}</td>
            </tr>
            <tr>
                <td class="label">Exam Duration</td>
                <td class="value" colspan="3">${data.examDuration}</td>
            </tr>
            <tr>
                <td class="label">Exam Centre Name & Address</td>
                <td class="value" colspan="3">
                    <strong>${data.examCentreName}</strong><br/>
                    ${data.examCentreAddress}
                </td>
            </tr>
        </table>

        <div class="instructions">
            <h4>IMPORTANT:—</h4>
            a) Carry this admit card along with a Adhar Card/ School ID/ PAN Card.<br/>
            b) Reach the examination center at least 30 minutes before the scheduled time.<br/>
            c) Mobile phones, calculators, and electronic devices are not allowed in exam Hall.<br/>
            <br/>
            <div style="text-align: center; font-weight: bold; margin-top: 5px;">
                INSTRUCTIONS TO BE FOLLOWED BY CANDIDATES AT THE EXAMINATION CENTRE
            </div>
        </div>

        <div class="footer">
            <div>Candidate Sign</div>
            <div>Seal</div>
            <div>Sign Head of Institute</div>
        </div>
    </div>
    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>
    `;
};
