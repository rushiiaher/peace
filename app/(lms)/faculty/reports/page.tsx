import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/lms/widgets"

export default function ReportsPage() {
  const reportTypes = [
    { title: "Student Performance Report", desc: "Detailed analysis of student marks and progress", icon: "📊" },
    { title: "Attendance Report", desc: "Student attendance summary by batch", icon: "📅" },
    { title: "Enquiry Conversion Report", desc: "Track your enquiry to admission conversion rate", icon: "🎯" },
    { title: "Syllabus Coverage Report", desc: "Monitor syllabus completion status", icon: "📚" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports" subtitle="Tracks and analyzes your performance metrics." />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Enquiries Converted" value="12" hint="This month" />
        <StatCard label="Conversion Rate" value="75%" />
        <StatCard label="Avg. Student Score" value="82%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reportTypes.map((report, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>{report.icon}</span>
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{report.desc}</p>
              <div className="flex gap-2">
                <Button size="sm">Generate Report</Button>
                <Button size="sm" variant="outline">View Sample</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
