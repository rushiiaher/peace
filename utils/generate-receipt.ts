
export const numberToWords = (num: number): string => {
    // Simple implementation for Indian Numbering System or standard
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Only';
};

interface ReceiptData {
    receiptNo: string
    date: string
    studentName: string
    amountInWords: string
    totalAmount: number
    paymentMode: string
    paymentDate: string
    bankName?: string // Optional
    admissionMonth: string
    installments: {
        name: string
        amount: number
        date: string
    }[]
    courseName: string
    courseDuration: string
    instituteName: string
}

export const generateReceiptHtml = (data: ReceiptData) => {
    // Shared Layout for Part A and Part B
    const renderPart = (title: string, copyType: string) => `
        <div class="receipt-part">
            <div style="background-color: #f6efe0; padding: 15px; border-bottom: 2px solid #d97706; display: flex; align-items: start; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                     <img src="/Peacexperts_LOGO.png" alt="Logo" style="height: 70px;" />
                     <div>
                         <h2 style="margin: 0; color: #d97706; font-size: 18px; font-weight: bold; line-height: 1.2;">Professional Education Academy<br/>For Computer Experts, Nashik</h2>
                         <p style="margin: 5px 0 0 0; font-size: 11px; color: #555; font-weight: 500;">Affiliated with Ministry of Corporate Affairs (Govt. of India) & An ISO:9001:2015 Certified Company</p>
                         <p style="margin: 3px 0 0 0; font-size: 11px; color: #333;"><strong>Reg. Office:</strong> 1st Floor, Above HDFC Bank, Near K.K.Wagh College, Nashik - 422003</p>
                         <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;"><strong>Contact:</strong> +91-9999999999 | <strong>Email:</strong> info@peaceexperts.com</p>
                     </div>
                </div>
                <div style="text-align: right; font-size: 12px; font-weight: bold; color: #d97706;">
                    <div style="border: 1px solid #d97706; padding: 2px 5px; border-radius: 4px; display: inline-block; margin-bottom: 5px;">${copyType}</div>
                    <div>${title}</div>
                </div>
            </div>
            
            <div class="receipt-body">
                <div class="row title-row" style="justify-content: center; margin-bottom: 20px;">
                    <div class="box-title" style="text-align: center; text-decoration: underline; font-size: 20px; color: #dc2626;">ADMISSION RECEIPT</div>
                </div>

                <div class="row">
                    <div class="col-half"><strong>Receipt No :</strong> ${data.receiptNo}</div>
                    <div class="col-half text-right"><strong>Date :</strong> ${data.date}</div>
                </div>

                <div class="row" style="margin-top: 15px;">
                    <div style="width: 100%;"><strong>Name Of Student :</strong> <span class="underline-fill" style="width: 75%; font-weight: bold;">${data.studentName}</span></div>
                </div>

                <div class="row" style="margin-top: 5px;">
                    <div style="width: 100%;"><strong>Amount in Words :</strong> <span class="underline-fill" style="width: 75%; font-style: italic;">${data.amountInWords}</span></div>
                </div>

                <div class="row" style="margin-top: 5px;">
                    <div class="col-grow">
                        <strong>Mode of Payment :</strong> <span class="underline-small">${data.paymentMode}</span>
                    </div>
                    <div class="col-fixed">
                        <strong>Date :</strong> <span class="underline-small">${data.paymentDate}</span>
                    </div>
                </div>

                <div class="row" style="margin-top: 15px;">
                     <div style="width: 100%;"><strong>Installments :</strong></div>
                     <div style="margin-left: 20px; font-size: 13px; margin-top: 5px; width: 100%;">
                     ${data.installments.map((inst, i) => `
                        <span style="margin-right: 20px; display: inline-block;">
                            • ${inst.name}: <strong>₹${inst.amount}</strong> (${inst.date})
                        </span>
                     `).join('')}
                     ${data.installments.length === 0 ? '<strong>Full Payment Received</strong>' : ''}
                     </div>
                </div>

                <div class="row" style="margin-top: 15px;">
                     <div><strong>Add. Month :</strong> <span class="underline-small">${data.admissionMonth}</span> &nbsp;&nbsp;&nbsp;&nbsp; <strong>Course Duration :</strong> ${data.courseDuration} Month / Year</div>
                </div>

                <div class="row" style="margin-top: 5px;">
                     <div><strong>Course Name :</strong> ${data.courseName}</div>
                </div>

                <div class="footer-row">
                    <div class="refund-box">
                        <div class="rupee-icon">₹</div>
                        <div class="amount-box">${data.totalAmount}</div>
                        <div class="refund-text">Fees Non Refundable</div>
                    </div>
                    <div class="auth-sig">
                        Authorized Course Instructor
                    </div>
                </div>
            </div>
        </div>
    `;

    return `
        <html>
        <head>
            <title>Fee Receipt - ${data.receiptNo}</title>
            <style>
                @page { size: A4; margin: 0; }
                body { font-family: sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 20px; box-sizing: border-box; }
                .receipt-container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #ccc; }
                
                .receipt-part { 
                    border: 2px solid #4a148c; 
                    margin-bottom: 20px; 
                    position: relative;
                }
                
                .header {
                    background-color: #4a148c;
                    color: white;
                    padding: 8px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .receipt-body {
                    padding: 15px 20px;
                    background-color: white;
                    color: #333;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .row { display: flex; flex-wrap: wrap; margin-bottom: 8px; align-items: baseline; }
                .col-half { width: 50%; }
                .col-grow { flex-grow: 1; }
                .col-fixed { margin-left: 15px; }
                .text-right { text-align: right; }
                
                .title-row { margin-bottom: 10px; }
                .box-title { font-weight: bold; font-size: 16px; width: 100%; }
                
                .underline-fill { 
                    border-bottom: 1px dotted #000; 
                    display: inline-block; 
                    width: 80%; 
                    margin-left: 5px; 
                    padding-left: 5px;
                }
                .underline-small {
                    border-bottom: 1px dotted #000;
                    padding: 0 5px;
                }

                .footer-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 30px;
                }

                .refund-box {
                    border: 2px solid #000;
                    padding: 5px;
                    display: inline-block;
                    position: relative;
                    min-width: 150px;
                }
                .rupee-icon {
                    background: black;
                    color: white;
                    width: 25px;
                    height: 25px;
                    text-align: center;
                    line-height: 25px;
                    font-weight: bold;
                    position: absolute;
                    top: 5px;
                    left: 5px;
                }
                .amount-box {
                    padding-left: 35px;
                    font-size: 18px;
                    font-weight: bold;
                    height: 25px;
                    line-height: 25px;
                }
                .refund-text {
                    font-size: 10px;
                    font-weight: bold;
                    margin-top: 2px;
                    text-transform: uppercase;
                }

                .auth-sig {
                    font-weight: bold;
                    font-size: 12px;
                    text-align: right;
                    border-top: 1px solid #ccc; /* Minimal visual guide for signature */
                    padding-top: 5px;
                    width: 200px;
                }

                .cut-line {
                    border-top: 1px dashed #4a90e2;
                    text-align: center;
                    margin: 20px 0;
                    color: #4a90e2;
                    font-size: 12px;
                    position: relative;
                }
                .cut-line span {
                    background: white;
                    padding: 0 10px;
                    position: relative;
                    top: -10px;
                }

            </style>
        </head>
        <body>
            <div class="receipt-container">
                ${renderPart('Part-A', 'Student Copy')}
                
                <div class="cut-line"><span>8.08"</span></div>
                
                ${renderPart('Part-B', 'Institute Copy')}
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;
};
