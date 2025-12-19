'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { FileText, Clock, Calendar, Award, HelpCircle, Play } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function StudentExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [admitCards, setAdmitCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dpp")

  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (studentId) fetchData()
  }, [studentId])

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes, cardsRes] = await Promise.all([
        fetch(`/api/students/${studentId}/exams`),
        fetch(`/api/students/${studentId}/results`),
        fetch(`/api/admit-cards?studentId=${studentId}`)
      ])

      const examsData = examsRes.ok ? await examsRes.json() : []
      const resultsData = resultsRes.ok ? await resultsRes.json() : []
      const cardsData = cardsRes.ok ? await cardsRes.json() : []

      setExams(Array.isArray(examsData) ? examsData : [])
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setAdmitCards(Array.isArray(cardsData) ? cardsData : [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const startExam = (examId: string) => {
    router.push(`/student/exams/${examId}`)
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  const dppExams = exams.filter((e: any) => e.type === 'DPP')
  const finalExams = exams.filter((e: any) => e.type === 'Final')
  const completedExams = results.length

  return (
    <div className="space-y-6">
      <SectionHeader title="Exams" subtitle="Take exams and view results" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">DPP Exams</p>
                <p className="text-3xl font-bold mt-2">{dppExams.length}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Final Exams</p>
                <p className="text-3xl font-bold mt-2">{finalExams.length}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{completedExams}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-6">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "dpp", label: "Daily Practice (DPP)", count: dppExams.length },
            { id: "final", label: "Final Exams", count: finalExams.length },
            { id: "admit", label: "Admit Cards", count: admitCards.length }
          ]}
        />
      </div>

      {activeTab === 'dpp' && (
        <div className="space-y-4">
          {exams.filter((e: any) => e.type === 'DPP').length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No DPPs available</CardContent></Card>
          ) : (
            exams.filter((e: any) => e.type === 'DPP').map((exam: any) => {
              const result = results.find((r: any) => r.examId?._id === exam._id)
              return (
                <Card key={exam._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base">{exam.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{exam.courseId?.name}</p>
                        </div>
                      </div>
                      {result && <Badge variant="secondary">Score: {result.percentage?.toFixed(0)}%</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Questions</p>
                          <p className="font-medium">{exam.questions?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{exam.duration} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Marks</p>
                          <p className="font-medium">{exam.totalMarks}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startExam(exam._id)}>
                      <Play className="w-4 h-4 mr-2" />
                      {result ? 'Re-attempt' : 'Start DPP'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'final' && (
        <div className="space-y-4">
          {exams.filter((e: any) => e.type === 'Final').length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No final exams scheduled</CardContent></Card>
          ) : (
            exams.filter((e: any) => e.type === 'Final').map((exam: any) => {
              const attempted = results.some((r: any) => r.examId?._id === exam._id)
              const assignment = exam.systemAssignments?.find((a: any) => a.studentId === studentId)
              const isPresent = assignment?.attended || false

              return (
                <Card key={exam._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base">{exam.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{exam.courseId?.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isPresent && <Badge variant="outline">Present</Badge>}
                        <Badge variant={attempted ? 'secondary' : 'default'}>
                          {attempted ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(exam.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Time</p>
                          <p className="font-medium">{exam.startTime} - {exam.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{exam.duration} mins</p>
                        </div>
                      </div>
                    </div>
                    {!attempted && (
                      <Button
                        size="sm"
                        onClick={() => startExam(exam._id)}
                        disabled={!isPresent}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isPresent ? 'Start Exam' : 'Waiting for Attendance'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'admit' && (
        <div className="space-y-4">
          {admitCards.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No admit cards available</CardContent></Card>
          ) : (
            admitCards.map((card: any) => (
              <Card key={card._id} className="hover:shadow-md transition-shadow py-0 overflow-hidden gap-0">
                <CardHeader className="pb-3 pt-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{card.examTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">{card.courseName}</p>
                    </div>
                    <Badge>Section {card.sectionNumber || 1}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 pb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Student Name</p>
                      <p className="font-medium">{card.studentName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Roll No</p>
                      <p className="font-medium">{card.rollNo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Exam Date</p>
                      <p className="font-medium">{new Date(card.examDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">{card.startTime} - {card.endTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{card.duration} mins</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Allocated System</p>
                      <p className="font-bold text-lg text-blue-600">{card.systemName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Institute</p>
                      <p className="font-medium">{card.instituteName}</p>
                    </div>
                  </div>
                  {card.rescheduled && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-800">Rescheduled</p>
                      <p className="text-xs text-yellow-700">{card.rescheduledReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
