import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export default function AddInstitute() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Institute" subtitle="Register new training institutes." />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="name">Institute Name</Label>
          <Input id="name" placeholder="Official name of the institute" />
        </div>
        <div className="grid gap-2">
          <Label>Institute Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="software">Software Training Institute</SelectItem>
              <SelectItem value="skill">Smart Skill Development Institute</SelectItem>
              <SelectItem value="beauty">Beauty Parlor / Sewing Training</SelectItem>
              <SelectItem value="robotics">Robotic Training Institute</SelectItem>
              <SelectItem value="kids">Kids Courses</SelectItem>
              <SelectItem value="abacus">Abacus Institute</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="courseCategory">Course Category</Label>
          <Input id="courseCategory" placeholder="Primary courses offered" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="active" />
          <Label htmlFor="active">Active</Label>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" placeholder="Overview of the institute" />
        </div>
        <div>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </section>
  )
}
