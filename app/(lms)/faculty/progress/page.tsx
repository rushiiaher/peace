import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/lms/widgets"

export default function ProgressPage() {
  const students = [
    { name: "Vikram Singh", batch: "SW-05", attendance: "78%", avgMarks: "62%", status: "Needs Attention" },
    { name: "Amit Kumar", batch: "SW-05", attendance: "85%", avgMarks: "88%", status: "Good" },
    { name: "Sneha Reddy", batch: "SW-05", attendance: "92%", avgMarks: "94%", status: "Excellent" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Student Progress" subtitle="Enables effective performance monitoring and student support." />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Students" value="42" />
        <StatCard label="Weak Students" value="5" hint="Need attention" />
        <StatCard label="Avg. Performance" value="82%" />
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline">All Students</Button>
        <Button size="sm" variant="outline">Weak Students</Button>
        <Button size="sm" variant="outline">Top Performers</Button>
      </div>

      <div className="grid gap-3">
        {students.map((student, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.batch}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="text-sm font-medium">{student.attendance}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg Marks</p>
                  <p className="text-sm font-medium">{student.avgMarks}</p>
                </div>
                <Badge variant={student.status === "Needs Attention" ? "destructive" : student.status === "Excellent" ? "default" : "secondary"}>
                  {student.status}
                </Badge>
                <Button size="sm" variant="outline">View Report</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
