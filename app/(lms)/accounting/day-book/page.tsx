import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"

export default function DayBook() {
  const incomeCols = [
    { key: "reg", label: "Reg. No." },
    { key: "name", label: "Student Name" },
    { key: "date", label: "Payment Date" },
    { key: "mode", label: "Payment Mode" },
    { key: "total", label: "Total Course Fees" },
    { key: "paid", label: "Paid Fees" },
    { key: "balance", label: "Balance Fees" },
    { key: "receipt", label: "Admission Receipt" },
  ]
  const incomeRows = [
    {
      reg: "REG-1001",
      name: "Kabir",
      date: "2025-10-12",
      mode: "Online",
      total: "₹20,000",
      paid: "₹5,000",
      balance: "₹15,000",
      receipt: "RCPT-001",
    },
  ]
  const expCols = [
    { key: "emp", label: "EMP ID" },
    { key: "ename", label: "Employee Name" },
    { key: "date", label: "Payment Date" },
    { key: "mode", label: "Payment Mode" },
    { key: "note", label: "Note" },
  ]
  const expRows = [{ emp: "E-01", ename: "S. Rao", date: "2025-10-12", mode: "Cash", note: "October salary partial" }]
  return (
    <section className="space-y-8">
      <SectionHeader title="Day Book" subtitle="Daily financial transactions record." />
      <div>
        <h2 className="text-lg font-semibold mb-2">Income - Student Payments</h2>
        <DataTable columns={incomeCols} rows={incomeRows} />
        <p className="text-right text-sm mt-2">Total Income: ₹5,000</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Expenditure - Salary Paid</h2>
        <DataTable columns={expCols} rows={expRows} />
        <p className="text-right text-sm mt-2">Total Expenditure: ₹0</p>
      </div>
      <p className="text-sm">Profit/Loss = Total Income - Total Expenses</p>
    </section>
  )
}
