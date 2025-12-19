import { SectionHeader } from "@/components/lms/section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function Settings() {
  return (
    <section className="space-y-8">
      <SectionHeader title="Settings" subtitle="Manage system settings and policies." />
      <div className="grid gap-8">
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">SMS Settings</h2>
          <Label>Provider</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twilio">Twilio</SelectItem>
            </SelectContent>
          </Select>
          <Label>API Key</Label>
          <Input placeholder="•••••••" />
          <Button className="w-fit">Save</Button>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">Email Settings</h2>
          <Label>SMTP Host</Label>
          <Input placeholder="smtp.example.com" />
          <Label>SMTP User</Label>
          <Input placeholder="user@example.com" />
          <Label>SMTP Password</Label>
          <Input type="password" />
          <Button className="w-fit">Save</Button>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">Upload Banner</h2>
          <Input type="file" accept="image/*" />
          <Button className="w-fit">Upload</Button>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">User Roles</h2>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select role to edit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="institute">Institute</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-fit">Update</Button>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">Update Profile</h2>
          <Label>Name</Label>
          <Input />
          <Label>Email</Label>
          <Input type="email" />
          <Button className="w-fit">Save</Button>
        </div>
        <div className="grid gap-4 max-w-2xl">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <Label>Current Password</Label>
          <Input type="password" />
          <Label>New Password</Label>
          <Input type="password" />
          <Button className="w-fit">Change</Button>
        </div>
        <div className="grid gap-4 max-w-3xl">
          <h2 className="text-lg font-semibold">Terms and Conditions</h2>
          <Textarea placeholder="Enter Terms and Conditions" rows={6} />
          <Button className="w-fit">Save</Button>
        </div>
        <div className="grid gap-4 max-w-3xl">
          <h2 className="text-lg font-semibold">Privacy Policy</h2>
          <Textarea placeholder="Enter Privacy Policy" rows={6} />
          <Button className="w-fit">Save</Button>
        </div>
        <div className="grid gap-4 max-w-3xl">
          <h2 className="text-lg font-semibold">Refund Policy</h2>
          <Textarea placeholder="Enter Refund Policy" rows={6} />
          <Button className="w-fit">Save</Button>
        </div>
      </div>
    </section>
  )
}
