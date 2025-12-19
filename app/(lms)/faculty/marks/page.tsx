import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MarksPage() {
  const students = [
    { id: 1, name: "Amit Kumar", practical: "", assignment: "18", project: "22", viva: "" },
    { id: 2, name: "Sneha Reddy", practical: "16", assignment: "20", project: "", viva: "" },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Marks Entry" subtitle="Handles internal assessment and grade entry." />
      
      <Tabs defaultValue="practical">
        <TabsList>
          <TabsTrigger value="practical">Practical</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="viva">Viva</TabsTrigger>
        </TabsList>
        
        <TabsContent value="practical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enter Practical Marks - Batch SW-05</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between border-b pb-3">
                    <span className="font-medium">{student.name}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="/25" 
                        className="w-20 rounded-md border px-3 py-1 text-sm"
                        defaultValue={student.practical}
                      />
                      <Button size="sm" variant="outline">Save</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button>Submit All Marks</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignment">Similar content for assignments...</TabsContent>
        <TabsContent value="project">Similar content for projects...</TabsContent>
        <TabsContent value="viva">Similar content for viva...</TabsContent>
      </Tabs>
    </div>
  )
}
