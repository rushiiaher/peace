
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
    examDuration: string;
    courseName: string;
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
        @page { size: A4; margin: 5mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 5px; color: #000; background: #fff; font-size: 13px; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1.5px solid #000; padding: 0; box-sizing: border-box; }
        
        /* Header */
        .header-section {
            display: flex;
            align-items: center;
            border-bottom: 1.5px solid #000;
            padding: 10px;
        }
        .logo-box { width: 15%; text-align: center; }
        .logo-box img { width: 90px; height: auto; border-radius: 50%; }
        .header-content { width: 85%; text-align: center; }
        .header-content h1 { margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .header-content p { margin: 2px 0; font-size: 12px; }
        .header-content .iso { font-size: 11px; }

        /* Title Area */
        .title-area {
            text-align: center;
            border-bottom: 1.5px solid #000;
            padding: 5px 0;
            background: #fff;
        }
        .title-area h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .title-area .subtext { font-size: 11px; font-style: italic; margin-top: 2px; }

        /* Details Table */
        .details-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000; }
        .details-table td { border: 1.5px solid #000; padding: 4px 10px; vertical-align: middle; height: 26px; font-size: 12px; }
        .details-table .label { font-weight: normal; width: 33%; }
        .details-table .value { font-weight: bold; text-transform: uppercase; text-align: left; }
        .photo-cell { width: 25%; text-align: center; }
        .photo-img { width: 120px; height: 145px; border: 1px solid #000; object-fit: cover; }

        /* Batch Schedule Title */
        .section-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            padding: 5px 0;
            border-bottom: 1.5px solid #000;
        }

        /* Schedule Table */
        .schedule-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-top: -1.5px; }
        .schedule-table th, .schedule-table td { border: 1.5px solid #000; padding: 4px 10px; vertical-align: middle; height: 26px; font-size: 12px; }
        .schedule-table .head { font-weight: bold; text-align: center; text-transform: uppercase; background: #fff; }
        .schedule-table .exam-centre-content { font-size: 12px; line-height: 1.4; padding: 8px; }
        .schedule-table .schedule-label { font-weight: normal; width: 33%; text-align: left; }
        .schedule-table .schedule-value { font-weight: bold; text-align: left; }

        /* Instructions */
        .instructions-box {
            padding: 10px;
            font-size: 12px;
            line-height: 1.5;
            border-bottom: 1.5px solid #000;
        }
        .instructions-box strong { display: block; margin-bottom: 5px; }
        .instructions-footer { text-align: center; font-weight: bold; padding: 8px 0; border-bottom: 1.5px solid #000; text-transform: uppercase; font-size: 13px; }

        /* Signature Area */
        .sign-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 40px 20px 10px;
            height: 80px;
        }
        .sign-box { text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header-section">
            <div class="logo-box">
                <img src="/Peacexperts_LOGO.png" alt="Logo" />
            </div>
            <div class="header-content">
                <h1>PEACEXPERTS ACADEMY, NASHIK</h1>
                <p>Reg. Under Ministry of Corporate Affairs (Govt. of India)</p>
                <p>Peacexperts Academy-MH2022PTC376485</p>
                <p class="iso">An ISO:9001:2015 Certified Orgnazation</p>
            </div>
        </div>

        <!-- Title -->
        <div class="title-area">
            <h2>CANDIDATE ADMIT CARD</h2>
            <div class="subtext">Name of Candidate (As Filled By the Candidate In Institute Login Window)</div>
        </div>

        <!-- Candidate Details -->
        <table class="details-table">
            <tr>
                <td class="label">Allocated System</td>
                <td class="value">${data.systemName || '---'}</td>
                <td class="photo-cell" rowspan="5">
                    ${data.photoUrl ? `<img src="${data.photoUrl}" class="photo-img" alt="Photo" />` : '<div style="width:120px;height:145px;border:1px solid #000;margin:0 auto;display:flex;align-items:center;justify-content:center;">PHOTO</div>'}
                </td>
            </tr>
            <tr>
                <td class="label">ROLL NO</td>
                <td class="value">${data.rollNo}</td>
            </tr>
            <tr>
                <td class="label">Student Name</td>
                <td class="value">${data.studentName}</td>
            </tr>
            <tr>
                <td class="label">Mother Name</td>
                <td class="value">${data.motherName || '---'}</td>
            </tr>
            <tr>
                <td class="label">UID</td>
                <td class="value">${data.aadhaarCard || '---'}</td>
            </tr>
            <tr>
                <td class="label">Course Name</td>
                <td class="value" colspan="2">${data.courseName || '---'}</td>
            </tr>
        </table>

        <!-- Batch Schedule -->
        <div class="section-header">BATCH SCHEDULE</div>
        <table class="schedule-table">
            <tr>
                <td class="head" style="width: 40%;">EXAM CENTRE</td>
                <td colspan="2" class="head">Schedule Details</td>
            </tr>
            <tr>
                <td rowspan="6" class="exam-centre-content" style="vertical-align: middle; text-align: center;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${data.examCentreName}</div>
                    <div style="font-size: 12px; color: #444;">${data.examCentreAddress}</div>
                </td>
                <td class="schedule-label">Exam Date</td>
                <td class="schedule-value">${data.examDate}</td>
            </tr>
            <tr>
                <td class="schedule-label">Batch</td>
                <td class="schedule-value">${data.batch}</td>
            </tr>
            <tr>
                <td class="schedule-label">Reporting Time</td>
                <td class="schedule-value">${data.reportingTime}</td>
            </tr>
            <tr>
                <td class="schedule-label">Gate Closing Time</td>
                <td class="schedule-value">${data.gateClosingTime}</td>
            </tr>
            <tr>
                <td class="schedule-label">Exam Start Time</td>
                <td class="schedule-value">${data.examStartTime}</td>
            </tr>
            <tr>
                <td class="schedule-label">Exam Duration</td>
                <td class="schedule-value">${data.examDuration}</td>
            </tr>
        </table>

        <!-- Instructions -->
        <div class="instructions-box">
            <strong>IMPORTANT INSTRUCTIONS:</strong>
            1. Carry this admit card along with a valid Govt. ID (Aadhaar/PAN/Voter ID).<br/>
            2. Reach the examination center at least 30 minutes before the Reporting Time.<br/>
            3. Mobile phones, calculators, and electronic gadgets are strictly prohibited in the Exam Hall.<br/>
            4. No candidate will be allowed to enter the hall after the Gate Closing Time.
        </div>
        <div class="instructions-footer">
            CANDIDATE MUST SIGN IN THE PRESENCE OF THE INVIGILATOR
        </div>

        <!-- Signature Area -->
        <div class="sign-container">
            <div class="sign-box">Candidate Sign</div>
            <div class="sign-box">Institute Seal</div>
            <div class="sign-box">HOEI Sign</div>
        </div>
    </div>
    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>
    `;
};

