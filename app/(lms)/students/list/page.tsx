import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"
import { Input } from "@/components/ui/input"

export default function StudentList() {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Student Name" },
    { key: "course", label: "Course" },
  ]
  const rows = [{ id: "STU-001", name: "Priya N.", course: "Advanced Diploma" }]
  return (
    <section className="space-y-6">
      <SectionHeader title="Student List" subtitle="View and manage all registered students." />
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm mb-1">From</label>
          <Input type="date" />
        </div>
        <div>
          <label className="block text-sm mb-1">To</label>
          <Input type="date" />
        </div>
        <div className="ml-auto">
          <label className="block text-sm mb-1">Auto Search</label>
          <Input placeholder="Search by name/ID" />
        </div>
      </div>
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
