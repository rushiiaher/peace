import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function EnquiriesPage() {
  const enquiries = [
    { id: "ENQ-104", name: "Rahul Sharma", course: "Web Development", status: "Hot", nextFollowUp: "Today, 3:00 PM", source: "Website" },
    { id: "ENQ-098", name: "Priya Patel", course: "Data Science", status: "Warm", nextFollowUp: "Tomorrow", source: "Referral" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="My Enquiries" subtitle="Manages your assigned enquiries and lead conversions." />
      
      <div className="flex gap-2">
        <Button size="sm">Add Notes</Button>
        <Button size="sm" variant="outline">Schedule Follow-up</Button>
        <Button size="sm" variant="secondary">Convert to Admission</Button>
      </div>

      <div className="grid gap-4">
        {enquiries.map((enq) => (
          <Card key={enq.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{enq.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{enq.id} • {enq.course}</p>
                </div>
                <Badge variant={enq.status === "Hot" ? "default" : "secondary"}>{enq.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Follow-up:</span>
                <span className="font-medium">{enq.nextFollowUp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source:</span>
                <span>{enq.source}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">Follow-up</Button>
                <Button size="sm" variant="outline">View Notes</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
