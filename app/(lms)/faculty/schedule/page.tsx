import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SchedulePage() {
  const schedule = [
    { day: "Monday", time: "10:00 - 12:00", batch: "SW-05", topic: "React Hooks", room: "Lab 2", coverage: "60%" },
    { day: "Monday", time: "14:00 - 16:00", batch: "SW-03", topic: "State Management", room: "Lab 1", coverage: "45%" },
    { day: "Wednesday", time: "10:00 - 12:00", batch: "SW-05", topic: "Context API", room: "Lab 2", coverage: "60%" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Class Schedule" subtitle="Provides your teaching schedule and academic planning tools." />
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline">This Week</Button>
        <Button size="sm" variant="outline">Next Week</Button>
        <Button size="sm" variant="outline">Full Timetable</Button>
      </div>

      <div className="grid gap-4">
        {schedule.map((cls, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{cls.topic}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cls.batch} • {cls.room}</p>
                </div>
                <Badge variant="outline">{cls.day}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{cls.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Syllabus Coverage:</span>
                <span className="font-medium">{cls.coverage}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Class Materials</Button>
                <Button size="sm" variant="outline">Update Coverage</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
