import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StudentsPage() {
  const students = [
    { id: "SW-2024-045", name: "Amit Kumar", batch: "SW-05", phone: "+91 98765 43210", attendance: "85%" },
    { id: "SW-2024-032", name: "Sneha Reddy", batch: "SW-05", phone: "+91 98765 43211", attendance: "92%" },
    { id: "SW-2024-018", name: "Vikram Singh", batch: "SW-03", phone: "+91 98765 43212", attendance: "78%" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="My Students" subtitle="Provides complete access to your assigned students." />
      
      <div className="flex gap-2">
        <Input placeholder="Search students..." className="max-w-xs" />
        <Button variant="outline">Filter by Batch</Button>
      </div>

      <div className="grid gap-3">
        {students.map((student) => (
          <Card key={student.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.id} • {student.batch}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="font-medium">{student.attendance}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Contact</Button>
                  <Button size="sm">View Progress</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
