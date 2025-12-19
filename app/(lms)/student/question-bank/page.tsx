'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { FileQuestion, HelpCircle, BookOpen, Play } from "lucide-react"

export default function StudentQuestionBankPage() {
  const router = useRouter()
  const [qbs, setQbs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (!studentId) return
    fetch(`/api/students/${studentId}/question-banks`)
      .then(res => res.json())
      .then(data => {
        setQbs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [studentId])

  const groupedQBs = qbs.reduce((acc: any, qb: any) => {
    const courseId = qb.courseId._id
    if (!acc[courseId]) {
      acc[courseId] = { course: qb.courseId, qbs: [] }
    }
    acc[courseId].qbs.push(qb)
    return acc
  }, {})

  if (loading) return <div className="space-y-6"><SectionHeader title="Question Bank" subtitle="Practice questions by course and topic" /><Skeleton className="h-32 w-full" /></div>

  const totalQBs = qbs.length
  const totalQuestions = qbs.reduce((sum: number, qb: any) => sum + (qb.questions?.length || 0), 0)

  return (
    <div className="space-y-6">
      <SectionHeader title="Question Bank" subtitle="Practice questions by course and topic" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question Banks</p>
                <p className="text-3xl font-bold mt-2">{totalQBs}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileQuestion className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-3xl font-bold mt-2">{totalQuestions}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(groupedQBs).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No question banks available</CardContent></Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {Object.values(groupedQBs).map((group: any, i) => (
            <AccordionItem key={i} value={`course-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{group.course.name}</p>
                      <p className="text-sm text-muted-foreground">{group.qbs.length} Topics</p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-4">
                {group.qbs.map((qb: any) => (
                  <Card key={qb._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileQuestion className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">{qb.topic}</CardTitle>
                        </div>
                        <Badge variant="outline">{qb.questions?.length || 0} Questions</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/student/question-bank/${qb._id}`)}
                        disabled={!qb.questions?.length}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
