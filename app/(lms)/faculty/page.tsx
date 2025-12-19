import { SectionHeader } from "@/components/lms/section"
import { StatCard, QuickAction } from "@/components/lms/widgets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FacultyDashboard() {
  const todayClasses = [
    { time: "10:00", topic: "HTML Basics", batch: "KIDS-01" },
    { time: "12:00", topic: "React State", batch: "SW-05" },
  ]

  return (
    <section className="space-y-6">
      <SectionHeader title="Dashboard Overview" subtitle="Your tasks, classes, and pending items." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Assigned Enquiries"
          value="6"
          hint="All enquiries assigned to you"
          action={
            <div className="flex gap-1">
              <Button asChild size="sm" variant="outline">
                <a href="/faculty/enquiries">Follow-up</a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href="/enquiry/add">Convert</a>
              </Button>
            </div>
          }
        />
        <StatCard 
          label="My Students" 
          value="48" 
          hint="Students in your assigned batches"
          action={
            <Button asChild size="sm" variant="outline">
              <a href="/faculty/students">View details</a>
            </Button>
          }
        />
        <StatCard
          label="Today's Classes"
          value="2"
          hint="Your class schedule for today"
          action={
            <Button asChild size="sm" variant="secondary">
              <a href="/faculty/attendance">Mark attendance</a>
            </Button>
          }
        />
        <StatCard
          label="Pending Marks"
          value="3"
          hint="Internal marks yet to be entered"
          action={
            <Button asChild size="sm" variant="secondary">
              <a href="/faculty/marks">Enter marks</a>
            </Button>
          }
        />
        <StatCard
          label="My Tasks"
          value="5"
          hint="Follow-ups and tasks due today"
          action={
            <Button asChild size="sm" variant="outline">
              <a href="/faculty/schedule">Complete tasks</a>
            </Button>
          }
        />
        <StatCard
          label="Attendance Summary"
          value="92%"
          hint="Your attendance for current month"
          action={
            <Button asChild size="sm" variant="outline">
              <a href="/faculty/attendance">View record</a>
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{c.topic}</p>
                  <p className="text-xs text-muted-foreground">{c.batch}</p>
                </div>
                <div className="text-sm text-muted-foreground">{c.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Follow-up with SW-ENQ-104</span>
              <span className="text-muted-foreground">Due today</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Enter viva marks - Batch SW-05</span>
              <span className="text-muted-foreground">EOD</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
