import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"

export default function Reports() {
  const columns = [
    { key: "report", label: "Report" },
    { key: "desc", label: "Description" },
  ]
  const rows = [
    { report: "Financial reports (Day Book, Profit/Loss)", desc: "Income/expense summaries and net result." },
    { report: "Student performance reports", desc: "Marks, grades, and trends." },
    { report: "Fee collection reports", desc: "Payments, dues, and receipts." },
    { report: "Enquiry conversion analytics", desc: "Leads to admissions pipeline." },
    { report: "Institute rating reports", desc: "Ratings across time." },
    { report: "Attendance reports", desc: "Batch-wise attendance." },
    { report: "Exam result analysis", desc: "Pass/fail, top performers." },
  ]
  return (
    <section className="space-y-6">
      <SectionHeader title="Reports" subtitle="Centralized reporting and analytics." />
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
