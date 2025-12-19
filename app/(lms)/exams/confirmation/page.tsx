import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ExamConfirmation() {
  return (
    <section className="space-y-8">
      <SectionHeader title="Exam Confirmation" subtitle="Prepare for exam day operations." />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generate Attendance</h2>
          <div className="grid gap-2 max-w-md">
            <label className="text-sm">Select Date</label>
            <Input type="date" />
            <label className="text-sm">Select Batch</label>
            <Input placeholder="Batch name" />
            <Button>Print</Button>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generate Password</h2>
          <div className="grid gap-2 max-w-md">
            <label className="text-sm">Select Date</label>
            <Input type="date" />
            <label className="text-sm">Select Batch</label>
            <Input placeholder="Batch name" />
            <Button>Generate & Print</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
