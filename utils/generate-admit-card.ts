
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
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 10px; color: #000; background: #fff; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 15px; box-sizing: border-box; }
        
        /* New Flex Header to prevent overlap */
        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }

        .logo-section {
            width: 120px;
            flex-shrink: 0;
        }
        .logo-section img {
            width: 100px;
            height: auto;
        }

        .institute-details {
            flex-grow: 1;
            text-align: center;
            padding: 0 15px;
        }
        .institute-details h1 {
            margin: 0;
            font-size: 22px;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.2;
        }
        .institute-details h3 {
            margin: 4px 0;
            font-size: 11px;
            font-weight: normal;
        }

        .photo-section {
            width: 130px;
            height: 160px;
            border: 1px solid #000;
            flex-shrink: 0;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .photo-section img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .admit-card-title {
            text-align: center;
            margin: 10px 0;
        }
        .admit-card-title h2 {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
        }
        
        .candidate-guidance {
            text-align: center;
            font-size: 13px;
            margin-bottom: 15px;
            font-style: italic;
        }

        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 15px; }
        table, th, td { border: 1.5px solid #000; }
        th, td { padding: 8px 12px; text-align: left; vertical-align: middle; }
        
        .label { font-weight: bold; width: 22%; background-color: #f2f2f2; }
        .value { font-weight: bold; text-transform: uppercase; }

        .section-divider {
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0 10px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }

        .instructions {
            font-size: 12.5px;
            line-height: 1.4;
            padding: 12px;
            border: 1.5px solid #000;
            margin-top: 15px;
            background: #fdfdfd;
        }
        .instructions h4 { margin: 0 0 8px 0; text-decoration: underline; font-size: 14px; }
        
        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            font-weight: bold;
            font-size: 15px;
            padding: 0 10px;
        }
        .sign-area {
            text-align: center;
            width: 180px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header-top">
            <div class="logo-section">
                <img src="/Peacexperts_LOGO.png" alt="PEACE Logo" />
            </div>
            
            <div class="institute-details">
                <h1>${data.instituteName}</h1>
                <h3>Reg. Under Ministry of Corporate Affairs (Govt. of India)</h3>
                <h3>PEACEXPERTS ACADEMY-MH2022PTC376485</h3>
                <h3>An ISO:9001:2015 Certified Organization</h3>
            </div>

            <div class="photo-section">
                ${data.photoUrl ? `<img src="${data.photoUrl}" alt="Photo" />` : '<div style="font-size:12px;color:#666;">PHOTO</div>'}
            </div>
        </header>

        <div class="admit-card-title">
            <h2>CANDIDATE ADMIT CARD</h2>
        </div>

        <div class="candidate-guidance">
            Name of the Candidate (As Filled By the Candidate In Institute Window)
        </div>

        <table>
            <tr>
                <td class="label">Allocated System</td>
                <td class="value" style="width: 28%;">${data.systemName || '---'}</td>
                <td class="label">Roll No.</td>
                <td class="value">${data.rollNo}</td>
            </tr>
            <tr>
                <td class="label">Student Name</td>
                <td class="value" colspan="3" style="font-size: 18px;">${data.studentName}</td>
            </tr>
            <tr>
                <td class="label">Mother's Name</td>
                <td class="value">${data.motherName || '---'}</td>
                <td class="label">Aadhaar Card</td>
                <td class="value">${data.aadhaarCard || '---'}</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align: center; font-weight: bold; padding: 6px; font-size: 13px; color: #333;">
                    VALID FOR — EXAMINATION ONLY
                </td>
            </tr>
        </table>

        <div class="section-divider">BATCH SCHEDULE</div>

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
                <td class="value" style="color: #c2410c;">${data.reportingTime}</td>
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
                <td class="value" colspan="3" style="font-size: 14px;">
                    <strong>${data.examCentreName}</strong><br/>
                    ${data.examCentreAddress}
                </td>
            </tr>
        </table>

        <div class="instructions">
            <h4>IMPORTANT INSTRUCTIONS:</h4>
            1. Carry this admit card along with a valid Govt. ID (Aadhaar/PAN/Voter ID).<br/>
            2. Reach the examination center at least 30 minutes before the Reporting Time.<br/>
            3. Mobile phones, calculators, and electronic gadgets are strictly prohibited in the Exam Hall.<br/>
            4. No candidate will be allowed to enter the hall after the Gate Closing Time.<br/>
            
            <div style="text-align: center; font-weight: bold; margin-top: 10px; text-decoration: underline;">
                CANDIDATE MUST SIGN IN THE PRESENCE OF THE INVIGILATOR
            </div>
        </div>

        <div class="footer">
            <div class="sign-area">Candidate's Signature</div>
            <div style="align-self: flex-end; padding-bottom: 10px;">(Institute Seal)</div>
            <div class="sign-area">Head of Institute Sign</div>
        </div>
    </div>
    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>
    `;
};
