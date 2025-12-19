import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AddStaff() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Staff List (Add Staff)" subtitle="Manage employee records and information." />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>EID</Label>
          <Input placeholder="Employee ID" />
        </div>
        <div className="grid gap-2">
          <Label>Employee Name</Label>
          <Input />
        </div>
        <div className="grid gap-2">
          <Label>DOB</Label>
          <Input type="date" />
        </div>
        <div className="grid gap-2">
          <Label>DOJ</Label>
          <Input type="date" />
        </div>
        <div className="grid gap-2">
          <Label>PAN</Label>
          <Input />
        </div>
        <div className="grid gap-2">
          <Label>Aadhar No</Label>
          <Input />
        </div>
        <div className="grid gap-2">
          <Label>Gender</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m">Male</SelectItem>
              <SelectItem value="f">Female</SelectItem>
              <SelectItem value="o">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Designation</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Address</Label>
          <Textarea />
        </div>
        <div className="grid gap-2">
          <Label>Mobile No</Label>
          <Input type="tel" />
        </div>
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input type="email" />
        </div>
        <div className="grid gap-2">
          <Label>Photo</Label>
          <Input type="file" accept="image/*" />
        </div>
        <Button type="submit">Save Staff</Button>
      </form>
    </section>
  )
}
