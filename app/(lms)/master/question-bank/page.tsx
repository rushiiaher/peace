import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function QuestionBank() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Questions" subtitle="Create and manage examination question banks." />
      <div className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <Label>Select Course</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c1">Course 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Theory Questions (Excel Upload)</Label>
          <Input type="file" accept=".xls,.xlsx" />
        </div>
        <div className="grid gap-2">
          <Label>Practical Questions (PDF Upload)</Label>
          <Input type="file" accept="application/pdf" />
        </div>
        <Button>Upload</Button>
      </div>
    </section>
  )
}
