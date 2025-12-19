import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function ExamDetails() {
  const columns = [
    { key: "sr", label: "Sr. No." },
    { key: "reg", label: "Registration No" },
    { key: "name", label: "Student Name" },
    { key: "course", label: "Course" },
    { key: "book", label: "With/Without Book" },
    { key: "fees", label: "Exam Fees" },
    { key: "action", label: "Action" },
  ]
  const rows = [
    {
      sr: "1",
      reg: "REG-1001",
      name: "Riya S.",
      course: "Diploma",
      book: "With Book",
      fees: "₹1200",
      action: <button className="text-primary underline">Confirm</button>,
    },
  ]
  return (
    <section className="space-y-6">
      <SectionHeader title="Exam Details" subtitle="Manage student exam registrations and confirmations." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div>
          <label className="block text-sm mb-1">Select Institute</label>
          <Input placeholder="Filter by institute" />
        </div>
        <div>
          <label className="block text-sm mb-1">Select Course</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c1">Course 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">From Date</label>
          <Input type="date" />
        </div>
        <div>
          <label className="block text-sm mb-1">To End Date</label>
          <Input type="date" />
        </div>
      </div>
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
