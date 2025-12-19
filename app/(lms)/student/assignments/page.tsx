import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AssignmentsPage() {
  const pending = [
    { title: "React Hooks Assignment", subject: "React Framework", dueDate: "25 Feb 2024", marks: 20 },
    { title: "JavaScript ES6 Features", subject: "JavaScript", dueDate: "28 Feb 2024", marks: 15 },
  ]

  const completed = [
    { title: "HTML Form Validation", subject: "HTML & CSS", submittedOn: "15 Feb 2024", grade: "18/20", status: "Graded" },
    { title: "CSS Flexbox Layout", subject: "HTML & CSS", submittedOn: "10 Feb 2024", grade: "Pending", status: "Submitted" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Assignments" subtitle="Acts as your assignment management and submission portal." />
      
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending (2)</TabsTrigger>
          <TabsTrigger value="completed">Completed (8)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-3">
          {pending.map((assignment, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.subject}</p>
                  </div>
                  <Badge variant="destructive">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{assignment.dueDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Marks:</span>
                  <span className="font-medium">{assignment.marks}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Submit Assignment</Button>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-3">
          {completed.map((assignment, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.subject}</p>
                  </div>
                  <Badge variant={assignment.status === "Graded" ? "default" : "secondary"}>
                    {assignment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted On:</span>
                  <span className="font-medium">{assignment.submittedOn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Grade:</span>
                  <span className="font-medium">{assignment.grade}</span>
                </div>
                <Button size="sm" variant="outline">View Submission</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
