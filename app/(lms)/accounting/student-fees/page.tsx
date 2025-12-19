import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StudentFees() {
  const columns = [
    { key: "sr", label: "Sr. No." },
    { key: "student", label: "Student Name" },
    { key: "course", label: "Course Name" },
    { key: "fee", label: "Course Fee" },
    { key: "discount", label: "Discount" },
    { key: "paid", label: "Paid" },
    { key: "balance", label: "Balance" },
    { key: "installments", label: "Total Installments" },
    { key: "next", label: "Next Installment Date" },
    { key: "add", label: "Add Fees" },
    { key: "outstanding", label: "Outstanding Fees" },
    { key: "receipt", label: "Fee Receipt" },
  ]
  const rows = [
    {
      sr: "1",
      student: "Neha S.",
      course: "Diploma",
      fee: "₹30,000",
      discount: "₹2,000",
      paid: "₹10,000",
      balance: "₹18,000",
      installments: "3",
      next: "2025-11-01",
      add: <Button size="sm">Record</Button>,
      outstanding: "₹18,000",
      receipt: (
        <Button size="sm" variant="outline">
          Download
        </Button>
      ),
    },
  ]
  return (
    <section className="space-y-6">
      <SectionHeader title="Student Fee Details" subtitle="Track student payments and outstanding fees." />
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm mb-1">From Date</label>
          <Input type="date" />
        </div>
        <div>
          <label className="block text-sm mb-1">End Date</label>
          <Input type="date" />
        </div>
      </div>
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
