'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { FileText, Clock, CheckCircle, Calendar, Users, Award, Search, Filter, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Loader from "@/components/ui/loader"

export default function InstituteExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [admitCards, setAdmitCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("exams")

  const [examSearch, setExamSearch] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('all')
  const [attendanceSearch, setAttendanceSearch] = useState('')
  const [dppSearch, setDppSearch] = useState('')
  const [overallSearch, setOverallSearch] = useState('')
  const [admitSearch, setAdmitSearch] = useState('')
  const [admitExamFilter, setAdmitExamFilter] = useState('all')

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (!instituteId) return
    fetchExams()
    fetchResults()
    fetchAdmitCards()
    fetchStudents()
  }, [instituteId])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(Array.isArray(data) ? data.filter((e: any) => e.instituteId?._id === instituteId || e.instituteId === instituteId) : [])
    } catch (error) {
      toast.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/exam-results')
      const data = await res.json()
      setResults(data)
    } catch (error) {
      toast.error('Failed to fetch results')
    }
  }

  const fetchAdmitCards = async () => {
    try {
      const res = await fetch('/api/admit-cards')
      const data = await res.json()
      setAdmitCards(data)
    } catch (error) {
      toast.error('Failed to fetch admit cards')
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=Student')
      const data = await res.json()
      setStudents(data.filter((s: any) => s.instituteId === instituteId))
    } catch (error) {
      console.error('Failed to fetch students')
    }
  }

  const getExamResults = (examId: string) => {
    return results.filter((r: any) => r.examId?._id === examId)
  }

  const getScoreboard = (examId: string) => {
    const examResults = getExamResults(examId)
    return examResults.sort((a: any, b: any) => b.score - a.score).slice(0, 10)
  }

  const getOverallScoreboard = () => {
    const dppResults = results.filter((r: any) => r.examId?.type === 'DPP')
    const studentScores: any = {}

    dppResults.forEach((r: any) => {
      const studentId = r.studentId?._id
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          name: r.studentId?.name,
          rollNo: r.studentId?.rollNo,
          totalScore: 0,
          totalMarks: 0,
          attempts: 0
        }
      }
      studentScores[studentId].totalScore += r.score
      studentScores[studentId].totalMarks += r.totalMarks
      studentScores[studentId].attempts++
    })

    return Object.values(studentScores)
      .map((s: any) => ({ ...s, percentage: (s.totalScore / s.totalMarks) * 100 }))
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 10)
  }

  const isExamStarted = (exam: any) => {
    const examDateTime = new Date(exam.date)
    const [hours, minutes] = (exam.startTime || '00:00').split(':')
    examDateTime.setHours(parseInt(hours), parseInt(minutes))
    return new Date() >= examDateTime
  }

  const filteredExams = exams.filter((e: any) => {
    const matchesSearch = e.title?.toLowerCase().includes(examSearch.toLowerCase()) ||
      e.courseId?.name?.toLowerCase().includes(examSearch.toLowerCase())
    const matchesType = examTypeFilter === 'all' || e.type === examTypeFilter
    const hasRescheduled = e.studentAssignments?.some((sa: any) => sa.isRescheduled)
    return matchesSearch && matchesType && !hasRescheduled
  })

  const filteredAttendanceExams = exams.filter((e: any) => {
    const isAttendanceExam = e.type === 'Final' && e.attendanceEnabled
    const matchesSearch = e.title?.toLowerCase().includes(attendanceSearch.toLowerCase())
    const hasRescheduled = e.title?.includes('(Rescheduled)')
    return isAttendanceExam && matchesSearch
  })

  const filteredDPPs = exams.filter((e: any) => {
    const isDPP = e.type === 'DPP'
    const matchesSearch = e.title?.toLowerCase().includes(dppSearch.toLowerCase())
    return isDPP && matchesSearch
  })

  const filteredOverall = getOverallScoreboard().filter((s: any) =>
    s.name?.toLowerCase().includes(overallSearch.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(overallSearch.toLowerCase())
  )

  const groupedAdmitCards = Array.isArray(admitCards) ? admitCards.reduce((acc: any, card: any) => {
    const examId = card.examId?._id || card.examId
    if (!acc[examId]) acc[examId] = []
    acc[examId].push(card)
    return acc
  }, {}) : {}

  const filteredAdmitCards = Object.entries(groupedAdmitCards).filter(([examId, cards]: any) => {
    const exam = exams.find((e: any) => e._id === examId)
    const matchesSearch = cards.some((c: any) =>
      c.studentName?.toLowerCase().includes(admitSearch.toLowerCase()) ||
      c.rollNo?.toLowerCase().includes(admitSearch.toLowerCase())
    )
    const matchesExam = admitExamFilter === 'all' || exam?.title === admitExamFilter
    return matchesSearch && matchesExam
  })

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalExams = exams.length
  const dppCount = exams.filter((e: any) => e.type === 'DPP').length
  const finalCount = exams.filter((e: any) => e.type === 'Final').length
  const totalResults = results.length

  return (
    <div className="space-y-6">
      <SectionHeader title="Exam Management" subtitle="Schedule exams, manage results, and issue admit cards." />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Exams</p>
                <p className="text-2xl font-bold">{totalExams}</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">DPP Exams</p>
                <p className="text-2xl font-bold">{dppCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Practice Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Final Exams</p>
                <p className="text-2xl font-bold">{finalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Major Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Total Results</p>
                <p className="text-2xl font-bold">{totalResults}</p>
                <p className="text-xs text-muted-foreground mt-1">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-4 flex justify-center">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "exams", label: "All Exams", count: totalExams },
            { id: "rescheduled", label: "Rescheduled", count: exams.filter((e: any) => e.type === 'Final' && e.title?.includes('(Rescheduled)')).length },
            { id: "attendance", label: "Attendance" },
            { id: "dpp-results", label: "DPP Results" },
            { id: "overall", label: "Scoreboard" },
            { id: "admit", label: "Admit Cards", count: admitCards.length }
          ]}
        />
      </div>

      <div className="space-y-6">
        {activeTab === 'rescheduled' && (
          <div className="space-y-4">
            {exams.filter((e: any) => e.type === 'Final' && e.title?.includes('(Rescheduled)')).length === 0 ? (
              <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No rescheduled exams found</p>
              </div>
            ) : (
              exams.filter((e: any) => e.type === 'Final' && e.title?.includes('(Rescheduled)')).map((exam: any) => {
                const rescheduledStudents = exam.systemAssignments || []
                return (
                  <Card key={exam._id} className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-3 bg-yellow-50/50 dark:bg-yellow-900/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            {exam.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{exam.courseId?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Date: {new Date(exam.date).toLocaleDateString()} • Time: {exam.startTime}</p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-100/50 text-yellow-700 border-yellow-200">
                          {rescheduledStudents.length} Students Affected
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-3 font-medium text-xs uppercase tracking-wide">Rescheduled Students</p>
                        <div className="grid gap-2">
                          {rescheduledStudents.map((sa: any, i: number) => {
                            const student = students.find((s: any) => s._id?.toString() === sa.studentId?.toString())
                            return (
                              <div key={i} className="flex items-center justify-between border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {student?.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{student?.name || 'Student'}</p>
                                    <p className="text-xs text-muted-foreground">{student?.rollNo} • {sa.systemName} • Section 999</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={sa.attended ? 'default' : 'secondary'} className={sa.attended ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}>
                                    {sa.attended ? 'Present' : 'Absent'}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">Reason: <span className="italic">{sa.rescheduledReason || 'Not specified'}</span></p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exam title or course..." value={examSearch} onChange={(e) => setExamSearch(e.target.value)} className="pl-9 bg-background" />
              </div>
              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DPP">DPP</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam: any) => (
                <Card key={exam._id} className="hover:shadow-md transition-all duration-200 group border-l-4 border-l-primary/50">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base line-clamp-1">{exam.title}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-1">{exam.courseId?.name}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="outline">{exam.type}</Badge>
                        {exam.studentAssignments?.some((sa: any) => sa.isRescheduled) && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Rescheduled</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-3 h-3" /> Date</span>
                        <span className="font-medium">{new Date(exam.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-3 h-3" /> Duration</span>
                        <span className="font-medium">{exam.duration} mins</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> Attempts</span>
                        <span className="font-medium">{getExamResults(exam._id).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search attendance exams..." value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="pl-9" />
            </div>

            {filteredAttendanceExams.length === 0 ? (
              <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No final exams with attendance tracking enabled</p>
              </div>
            ) : (
              filteredAttendanceExams.map((exam: any) => {
                const examStarted = isExamStarted(exam)
                return (
                  <Card key={exam._id} className="hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader className="border-b bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded-lg border">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{exam.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{new Date(exam.date).toLocaleString()}</p>
                          </div>
                        </div>
                        {examStarted && <Badge variant="destructive" className="animate-pulse">Exam Started</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6">Student Name</TableHead>
                            <TableHead>System</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exam.systemAssignments?.map((assignment: any, i: number) => (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-medium pl-6">{assignment.studentId?.name || 'Student'}</TableCell>
                              <TableCell><Badge variant="outline">{assignment.systemName}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={assignment.attended ? 'default' : 'secondary'} className={assignment.attended ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}>
                                  {assignment.attended ? 'Present' : 'Absent'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                {!assignment.attended && !examStarted && (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/exams/${exam._id}/mark-attendance`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ studentId: assignment.studentId?._id || assignment.studentId })
                                        })
                                        if (res.ok) {
                                          toast.success('Attendance marked')
                                          fetchExams()
                                        }
                                      } catch (error) {
                                        toast.error('Failed to mark attendance')
                                      }
                                    }}
                                  >
                                    Mark Present
                                  </Button>
                                )}
                                {examStarted && !assignment.attended && (
                                  <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                    <AlertCircle className="w-3 h-3" /> Late
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'dpp-results' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search DPP title..." value={dppSearch} onChange={(e) => setDppSearch(e.target.value)} className="pl-9" />
            </div>

            {filteredDPPs.map((exam: any) => {
              const scoreboard = getScoreboard(exam._id)
              return (
                <Card key={exam._id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="border-b bg-muted/10 py-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-500" />
                      <CardTitle className="text-base">{exam.title} <span className="text-muted-foreground font-normal text-sm">- Top Performers</span></CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableHead className="w-16 pl-6">Rank</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right pr-6">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scoreboard.map((result: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-bold pl-6 text-primary">#{i + 1}</TableCell>
                            <TableCell className="font-medium">{result.studentId?.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{result.studentId?.rollNo}</TableCell>
                            <TableCell className="text-right font-bold">{result.score}<span className="text-muted-foreground font-normal">/{result.totalMarks}</span></TableCell>
                            <TableCell className="text-right pr-6">
                              <Badge variant={result.percentage >= 80 ? 'default' : result.percentage >= 50 ? 'secondary' : 'destructive'}>
                                {result.percentage?.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {activeTab === 'overall' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student name or roll no..." value={overallSearch} onChange={(e) => setOverallSearch(e.target.value)} className="pl-9" />
            </div>

            <Card className="hover:shadow-md transition-shadow overflow-hidden border-t-4 border-t-purple-500">
              <CardHeader className="border-b bg-purple-50/50 dark:bg-purple-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Overall Performance Leaderboard</CardTitle>
                    <CardDescription>Cumulative scores from all DPP exams.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="w-16 pl-6">Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead className="text-right">Total Score</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right pr-6">Attempts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverall.map((student: any, i: number) => (
                      <TableRow key={i} className={i < 3 ? "bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10" : ""}>
                        <TableCell className="pl-6">
                          {i === 0 ? <span className="text-2xl">🥇</span> :
                            i === 1 ? <span className="text-2xl">🥈</span> :
                              i === 2 ? <span className="text-2xl">🥉</span> :
                                <span className="font-bold text-muted-foreground">#{i + 1}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-base">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.rollNo}</TableCell>
                        <TableCell className="text-right font-bold text-base">{student.totalScore}<span className="text-muted-foreground text-sm font-normal">/{student.totalMarks}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="w-full max-w-[80px] ml-auto">
                            <Badge variant="outline" className="w-full justify-center bg-background">
                              {student.percentage?.toFixed(1)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 text-muted-foreground">{student.attempts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'admit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student name..." value={admitSearch} onChange={(e) => setAdmitSearch(e.target.value)} className="pl-9 bg-background" />
              </div>
              <Select value={admitExamFilter} onValueChange={setAdmitExamFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.filter((e: any) => e.type === 'Final').map((e: any) => (
                    <SelectItem key={e._id} value={e.title}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredAdmitCards.map(([examId, cards]: any) => {
              const exam = exams.find((e: any) => e._id === examId)
              return (
                <Card key={examId} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="border-b bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-lg border">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{exam?.title || 'Exam'}</CardTitle>
                        <CardDescription>Admit cards issued for this exam</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-6">Student Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Exam Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>System</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cards.map((card: any) => (
                          <TableRow key={card._id} className="hover:bg-muted/30">
                            <TableCell className="font-medium pl-6">{card.studentName}</TableCell>
                            <TableCell className="text-muted-foreground">{card.rollNo}</TableCell>
                            <TableCell>{new Date(card.examDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs font-mono bg-muted/50 p-1 rounded w-fit px-2">{card.startTime} - {card.endTime}</TableCell>
                            <TableCell><Badge variant="outline">{card.systemName}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
