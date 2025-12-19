import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/lms/widgets"

export default function BatchesPage() {
  const batches = [
    { name: "SW-05", course: "Web Development", students: 24, schedule: "Mon, Wed, Fri - 10:00 AM", progress: "65%" },
    { name: "SW-03", course: "React Advanced", students: 18, schedule: "Tue, Thu - 2:00 PM", progress: "42%" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="My Batches" subtitle="Manages classes and student organization within your batches." />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Batches" value="2" />
        <StatCard label="Total Students" value="42" />
        <StatCard label="Avg. Attendance" value="88%" />
      </div>

      <div className="grid gap-4">
        {batches.map((batch) => (
          <Card key={batch.name}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{batch.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{batch.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{batch.students} Students</p>
                  <p className="text-xs text-muted-foreground">Progress: {batch.progress}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Schedule: </span>
                <span>{batch.schedule}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Take Attendance</Button>
                <Button size="sm" variant="outline">View Schedule</Button>
                <Button size="sm" variant="outline">Track Progress</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
