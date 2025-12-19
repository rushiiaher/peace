import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddBatch() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Student Batches" subtitle="Organize students into batches for structured learning." />
      <form className="grid gap-4 max-w-xl">
        <div className="grid gap-2">
          <Label>Batch Name</Label>
          <Input placeholder='e.g., "August Exam Event"' />
        </div>
        <div className="grid gap-2">
          <Label>Select Course</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c1">Course 1</SelectItem>
              <SelectItem value="c2">Course 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Batch Start Date</Label>
          <Input type="date" />
        </div>
        <div className="grid gap-2">
          <Label>Batch End Date</Label>
          <Input type="date" />
        </div>
        <Button type="submit">Add New Batch</Button>
      </form>
    </section>
  )
}
