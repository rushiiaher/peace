import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"

export default function Complaints() {
  const columns = [
    { key: "institute", label: "Institute" },
    { key: "status", label: "Status" },
    { key: "subject", label: "Subject" },
  ]
  const rows = [{ institute: "ABC Training", status: "Open", subject: "Facility issue" }]
  return (
    <section className="space-y-6">
      <SectionHeader title="Manage Complaints" subtitle="View institute-wise and status-wise complaints." />
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
