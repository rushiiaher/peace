import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DeleteCourse() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Delete Course" subtitle="Remove courses with no active enrollments." />
      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Search Course</label>
          <Input placeholder="Type course name or code" />
        </div>
        <div className="flex gap-2">
          <Button variant="destructive">Confirm Deletion</Button>
        </div>
        <p className="text-xs text-muted-foreground">Note: Only courses with no active enrollments can be deleted.</p>
      </div>
    </section>
  )
}
