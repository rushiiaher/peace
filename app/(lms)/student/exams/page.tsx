'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { FileText, Clock, Calendar, Award, HelpCircle, Play, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateAdmitCardHtml } from "@/utils/generate-admit-card"
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

  const handleDownloadAdmitCard = (card: any) => {
    try {
      const adjustTime = (timeStr: string, minutesToSubtract: number) => {
        if (!timeStr) return '00:00'
        const [hours, minutes] = timeStr.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)
        date.setMinutes(date.getMinutes() - minutesToSubtract)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
      }

      const batchName = card.examTitle?.includes('-') ? card.examTitle.split('-').pop().trim() : 'Regular Batch'

      const data = {
        instituteName: "PEACEXperts Academy, Nashik",
        candidateName: card.studentName,
        photoUrl: card.studentId?.documents?.photo,
        systemName: card.systemName,
        rollNo: card.rollNo,
        studentName: card.studentName,
        motherName: (card.studentId?.motherName || '').trim().split(' ')[0] || '__________',
        aadhaarCard: card.studentId?.aadhaarCardNo || '__________',
        examCentreCode: 'DLC-IT' + (card.rollNo?.substring(0, 4) || '1081'),
        batch: batchName,
        examDate: new Date(card.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        reportingTime: adjustTime(card.startTime, 30),
        gateClosingTime: adjustTime(card.startTime, 5),
        examStartTime: adjustTime(card.startTime, 0),
        examDuration: `${card.duration} Minutes`,
        examCentreName: card.instituteName,
        examCentreAddress: "Exam Center Address will be provided by Institute."
      }

      const html = generateAdmitCardHtml(data)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      } else {
        toast.error("Please allow popups to download admit card")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate admit card")
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.filter((e: any) => e.type === 'DPP').length === 0 ? (
            <div className="col-span-full">
              <Card><CardContent className="py-12 text-center text-muted-foreground">No DPPs available</CardContent></Card>
            </div>
          ) : (
            exams.filter((e: any) => e.type === 'DPP').map((exam: any) => {
              const result = results.find((r: any) => r.examId?._id === exam._id)
              return (
                <Card key={exam._id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/40 overflow-hidden flex flex-col h-full bg-card">
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs bg-secondary/50">
                          {exam.questions?.length || 0} Questions
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exam.duration} mins
                        </Badge>
                      </div>
                      {result && <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs shadow-sm">Scored: {result.percentage?.toFixed(0)}%</Badge>}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        {exam.courseId?.name}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 py-2 text-xs text-muted-foreground grid grid-cols-2 gap-y-1">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 opacity-70" />
                      <span>{exam.totalMarks} Marks</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t bg-muted/5 mt-auto pb-4 px-4">
                    <Button className="w-full" size="sm" onClick={() => startExam(exam._id)}>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      {result ? 'Re-attempt' : 'Start Practice'}
                    </Button>
                  </CardFooter>
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
              // Fix: Handle both populated (object) and unpopulated (string) studentId
              const assignment = exam.systemAssignments?.find((a: any) =>
                (a.studentId?._id || a.studentId) === studentId
              )
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
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base">Admit Cards</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {admitCards.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No admit cards available</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Exam Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admitCards.map((card: any) => (
                      <TableRow key={card._id}>
                        <TableCell className="pl-6 font-medium">
                          {card.examTitle}
                          {card.rescheduled && (
                            <Badge variant="outline" className="ml-2 text-[10px] border-yellow-200 bg-yellow-50 text-yellow-700">
                              Rescheduled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{card.courseName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">{card.systemName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {new Date(card.examDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {card.startTime} - {card.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={() => handleDownloadAdmitCard(card)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
