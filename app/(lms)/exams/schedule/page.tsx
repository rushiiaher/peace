import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function ScheduleExam() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Online Exam Date" subtitle="Schedule online examinations." />
      <form className="grid gap-4 max-w-xl">
        <div className="grid gap-2">
          <Label>Exam Date</Label>
          <Input type="date" />
        </div>
        <div className="grid gap-2">
          <Label>No. of PCs (default 10)</Label>
          <Input type="number" placeholder="10" />
        </div>
        <div className="grid gap-2">
          <Label>Exam Batch</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select exam batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b1">Batch A (10:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Save Schedule</Button>
      </form>
    </section>
  )
}
