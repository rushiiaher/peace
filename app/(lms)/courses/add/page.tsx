import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function AddCourse() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add New Course" subtitle="Create and configure course offerings." />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>Course Code</Label>
          <Input placeholder="Unique identifier" />
        </div>
        <div className="grid gap-2">
          <Label>Course Name</Label>
          <Input placeholder="Full course title" />
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Certificate / Diploma / ..." />
            </SelectTrigger>
            <SelectContent>
              {["Certificate", "Diploma", "Advanced Diploma", "Master Diploma"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Course Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Predefined categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cat1">Category 1</SelectItem>
              <SelectItem value="cat2">Category 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Total Course Fees</Label>
          <Input type="number" placeholder="Full course amount" />
        </div>
        <div className="grid gap-2">
          <Label>Exam Fee With Book</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Exam Fee Without Book</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Maximum Discount (%)</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Duration (months)</Label>
          <Input type="number" />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="status" />
          <Label htmlFor="status">Active</Label>
        </div>
        <Button type="submit">Save Course</Button>
      </form>
    </section>
  )
}
