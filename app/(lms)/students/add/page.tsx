import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AddStudent() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Student (Admission Form)" subtitle="Register new students into the system." />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input placeholder="Student's full name" />
        </div>
        <div className="grid gap-2">
          <Label>Mother Name</Label>
          <Input placeholder="Mother's name" />
        </div>
        <div className="grid gap-2">
          <Label>Mobile</Label>
          <Input type="tel" placeholder="Contact number" />
        </div>
        <div className="grid gap-2">
          <Label>Username</Label>
          <Input placeholder="System login username" />
        </div>
        <div className="grid gap-2">
          <Label>Aadhar No</Label>
          <Input placeholder="Government ID" />
        </div>
        <div className="grid gap-2">
          <Label>App ID</Label>
          <Input placeholder="Application identification" />
        </div>
        <div className="grid gap-2">
          <Label>Higher Qualification</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hs">Higher Secondary</SelectItem>
              <SelectItem value="grad">Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Select Course</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c1">Certificate</SelectItem>
              <SelectItem value="c2">Diploma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Photo</Label>
          <Input type="file" accept="image/*" />
        </div>
        <Button type="submit">Submit Admission</Button>
      </form>
    </section>
  )
}
