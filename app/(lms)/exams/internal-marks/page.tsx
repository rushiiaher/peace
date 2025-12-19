import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function InternalMarks() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Internal Marks" subtitle="Record internal assessment marks." />
      <form className="grid gap-4 max-w-xl">
        <div className="grid gap-2">
          <Label>Practical</Label>
          <Input type="number" placeholder="Score" />
        </div>
        <div className="grid gap-2">
          <Label>Assignment</Label>
          <Input type="number" placeholder="Score" />
        </div>
        <div className="grid gap-2">
          <Label>Project</Label>
          <Input type="number" placeholder="Score" />
        </div>
        <div className="grid gap-2">
          <Label>Viva</Label>
          <Input type="number" placeholder="Score" />
        </div>
        <Button type="submit">Save Marks</Button>
      </form>
    </section>
  )
}
