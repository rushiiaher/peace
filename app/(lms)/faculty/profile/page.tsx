import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="My Profile" subtitle="Handles your personal and professional information." />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">Dr. Rajesh Kumar</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">FAC-2023-045</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">rajesh.kumar@institute.edu</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">+91 98765 43210</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">Computer Science</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joining Date</p>
                <p className="font-medium">15 Jan 2023</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button size="sm">Edit Details</Button>
              <Button size="sm" variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">Download Salary Slips</Button>
              <Button variant="outline" className="w-full justify-start">Request Leave</Button>
              <Button variant="outline" className="w-full justify-start">View Documents</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attendance:</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Classes Taken:</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Leave Balance:</span>
                <span className="font-medium">8 days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
