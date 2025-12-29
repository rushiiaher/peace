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
import {
  FileText, Clock, CheckCircle, Calendar, Users, Award, Search, Filter,
  AlertTriangle, AlertCircle, ArrowRight, DollarSign, Ban, RefreshCw,
  Timer, XCircle, MapPin, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Loader from "@/components/ui/loader"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { generateAdmitCardHtml } from "@/utils/generate-admit-card"


export default function InstituteExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [admitCards, setAdmitCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([]) // Renamed to avoid confusion

  // Scheduling State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedExamNumber, setSelectedExamNumber] = useState<string>('1')
  const [scheduleDate, setScheduleDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduling, setScheduling] = useState(false)

  // New State for Batch-wise Scheduling
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [allCourseStudents, setAllCourseStudents] = useState<any[]>([])

  // ... existing effects ...

  // Helper to check exam status
  const getStudentExamStatus = (studentId: string, examNum: number) => {
    // Check if Admit Card exists (Assigned)
    const assigned = admitCards.some((c: any) =>
      (c.studentId?._id === studentId || c.studentId === studentId) &&
      c.examNumber === examNum
    )
    // Check if Result exists (Completed) - Optional safety check
    // Assuming results have examNumber or we match by logic. 
    // Since result structure isn't fully clear, we focus on admit card which is the prerequisite.
    // However, let's also check if user is in 'results' for this exam if possible.
    // For now, strict admit card check is usually enough for "Assigned".
    return assigned
  }

  // Filter eligible students
  // Check eligibility for a specific student
  const isStudentEligible = (student: any, examNum: number) => {
    const hasTakenCurrent = getStudentExamStatus(student._id, examNum)
    const hasTakenPrevious = examNum === 1 ? true : getStudentExamStatus(student._id, examNum - 1)
    return hasTakenPrevious && !hasTakenCurrent
  }

  // Filter eligible students for selected batch
  const eligibleStudents = allCourseStudents
    .filter(s => s.batchId?._id === selectedBatchId || s.batchId === selectedBatchId)
    .filter(student => isStudentEligible(student, parseInt(selectedExamNumber)))

  // ...



  // ...

  const currentCourse = courses.find((c: any) => c._id === selectedCourseId)
  const examConfigs = currentCourse?.examConfigurations || []

  // ...



  const [activeTab, setActiveTab] = useState("schedule")

  // Filters for Exam Lists
  const [filterCourseId, setFilterCourseId] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Admit Card Filters
  const [admitFilterCourse, setAdmitFilterCourse] = useState('all')
  const [admitFilterExam, setAdmitFilterExam] = useState('all')
  const [admitSearchQuery, setAdmitSearchQuery] = useState('')

  const [resultFilterCourse, setResultFilterCourse] = useState('all')
  const [resultFilterExam, setResultFilterExam] = useState('all')
  const [resultSearchQuery, setResultSearchQuery] = useState('')

  // Attendance Filters
  const [attendanceFilterCourse, setAttendanceFilterCourse] = useState('all')
  const [attendanceFilterExam, setAttendanceFilterExam] = useState('all')
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('')

  // ... existing effects ...

  // Filters batches to show only those with eligible students for the selected exam
  const availableBatches = batches.filter(batch => {
    if (batch.status !== 'Active') return false
    // Check if ANY student in this batch is eligible for selectedExamNumber
    const studentsInBatch = allCourseStudents.filter(s => s.batchId?._id === batch._id || s.batchId === batch._id)
    const hasEligible = studentsInBatch.some(s => isStudentEligible(s, parseInt(selectedExamNumber)))
    return hasEligible
  })

  // Fetch batches when course changes
  useEffect(() => {
    if (selectedCourseId && instituteId) {
      fetchBatchesForCourse()
      fetchStudentsForCourse() // Fetch all potential students once
      setSelectedBatchId('')
      setSelectedStudentIds([])
    }
  }, [selectedCourseId, instituteId])


  const fetchBatchesForCourse = async () => {
    try {
      const res = await fetch(`/api/batches?instituteId=${instituteId}&courseId=${selectedCourseId}`)
      const data = await res.json()
      // Filter for Active batches only
      setBatches(Array.isArray(data) ? data.filter((b: any) => b.status === 'Active') : [])
    } catch (e) {
      console.error("Failed to fetch batches")
    }
  }

  const fetchStudentsForCourse = async () => {
    try {
      // Fetch ALL Royalty Paid students for this course
      const res = await fetch(`/api/users?instituteId=${instituteId}&role=student&courseId=${selectedCourseId}&royaltyPaid=true`)
      const data = await res.json()
      setAllCourseStudents(Array.isArray(data) ? data : [])
      setSelectedStudentIds([])
    } catch (e) {
      console.error("Failed to fetch students")
    }
  }

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length && eligibleStudents.length > 0) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(eligibleStudents.map(s => s._id))
    }
  }

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
    fetchCourses()
  }, [instituteId])

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
      // toast.error("Failed to generate admit card")
    }
  }

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
      // toast.error('Failed to fetch results')
    }
  }

  const fetchAdmitCards = async () => {
    if (!instituteId) return
    try {
      const res = await fetch(`/api/admit-cards?instituteId=${instituteId}`)
      const data = await res.json()
      setAdmitCards(Array.isArray(data) ? data : [])
    } catch (error) {
      setAdmitCards([])
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/users?role=Student&instituteId=${instituteId}`)
      const data = await res.json()
      setStudents(data.filter((s: any) => s.instituteId === instituteId || s.instituteId?._id === instituteId))
    } catch (error) {
      console.error('Failed to fetch students')
    }
  }

  const fetchCourses = async () => {
    if (!instituteId) return
    try {
      const res = await fetch(`/api/institutes/${instituteId}/courses`)
      const data = await res.json()
      // Extract the nested course object from the assignment and filter out any nulls
      const validCourses = data.map((item: any) => item.courseId).filter((c: any) => c)
      setCourses(validCourses)
    } catch (error) {
      console.error('Failed to fetch courses')
    }
  }

  const handlePayRoyalty = async (studentId: string, courseId: string) => {
    try {
      const res = await fetch('/api/payments/royalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId,
          instituteId,
          amount: 50, // Hardcoded royalty amount for now
          paymentMode: 'Manual',
          transactionId: `ROYALTY-${Date.now()}`
        })
      })

      if (res.ok) {
        toast.success('Royalty Paid Successfully')
        fetchStudents() // Refresh student list to update status
      } else {
        toast.error('Failed to pay royalty')
      }
    } catch (error) {
      toast.error('Payment Error')
    }
  }

  const handleScheduleExam = async () => {
    if (!selectedCourseId || selectedStudentIds.length === 0 || !scheduleDate || !startTime) {
      toast.error('Please select course, students, date, and time')
      return
    }

    setScheduling(true)
    try {
      const res = await fetch('/api/exams/schedule-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId,
          courseId: selectedCourseId,
          studentIds: selectedStudentIds,
          date: scheduleDate,
          startTime,
          title: scheduleTitle,
          batchId: selectedBatchId,
          examNumber: parseInt(selectedExamNumber)
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Exam Scheduled Successfully`)
        setExams([...exams, data.exam ? data.exam : data])
        setSelectedStudentIds([])
        setScheduleTitle('')
        setActiveTab('final')
        fetchAdmitCards()
      } else {
        toast.error(data.error || 'Failed to schedule')
      }
    } catch (error) {
      toast.error('Scheduling failed')
    } finally {
      setScheduling(false)
    }
  }

  const getFilteredExams = (type: string, isRescheduled: boolean = false) => {
    return exams.filter((exam: any) => {
      // In institute panel, we might want to see both Final and DPP, but the request focuses on Final/Rescheduled
      // Adjust logic: if type is 'Final', checking matches
      if (type === 'Final') {
        if (exam.type !== 'Final') return false
      }

      const reschMatch = isRescheduled ? exam.title.includes('(Rescheduled)') : !exam.title.includes('(Rescheduled)')

      const courseMatch = filterCourseId === 'all' || exam.courseId?._id === filterCourseId || exam.courseId === filterCourseId
      const statusMatch = filterStatus === 'all' || exam.status === filterStatus
      const searchMatch = !searchQuery || exam.title.toLowerCase().includes(searchQuery.toLowerCase())

      return reschMatch && courseMatch && statusMatch && searchMatch
    })
  }

  const isExamStarted = (exam: any) => {
    const examDateTime = new Date(exam.date)
    const [hours, minutes] = (exam.startTime || '00:00').split(':')
    examDateTime.setHours(parseInt(hours), parseInt(minutes))
    return new Date() >= examDateTime
  }

  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId))
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId])
    }
  }

  if (loading) return <div className="flex justify-center py-20 px-4"><Loader /></div>

  const totalExams = exams.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SectionHeader title="Exam Management" subtitle="Schedule exams, manage admit cards, and view results." />
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/institute-admin/exams/reschedule">
            <RefreshCw className="w-4 h-4" />
            Request Reschedule
          </Link>
        </Button>
      </div>

      <div className="flex justify-center pb-2 w-full overflow-x-auto">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "schedule", label: "Schedule Exam" },
            { id: "final", label: "Final Exams", count: getFilteredExams('Final', false).length },
            { id: "rescheduled", label: "Rescheduled", count: getFilteredExams('Final', true).length },
            { id: "attendance", label: "Attendance" },
            { id: "admit", label: "Admit Cards", count: admitCards.length },
            { id: "results", label: "Results" },
          ]}
        />
      </div>

      <div className="space-y-6">
        {/* SCHEDULE EXAM TAB */}
        {activeTab === 'schedule' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 h-fit shadow-md border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Exam Configuration</CardTitle>
                <CardDescription>Set up a new final exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Course</label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="w-full [&>span]:truncate">
                      <SelectValue placeholder="Choose course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c: any) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Exam</label>
                  <Select value={selectedExamNumber} onValueChange={(val) => { setSelectedExamNumber(val); setSelectedBatchId('') }} disabled={!selectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose exam..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examConfigs.length === 0 ? (
                        <SelectItem value="1">Default Final Exam</SelectItem>
                      ) : (
                        examConfigs.map((config: any) => (
                          <SelectItem key={config.examNumber} value={config.examNumber.toString()}>
                            Exam {config.examNumber} ({config.duration} mins, {config.totalQuestions} Qs)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Batch</label>
                  <Select value={selectedBatchId} onValueChange={setSelectedBatchId} disabled={!selectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedCourseId ? "Select Course First" : "Choose active batch..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.length === 0 ? (
                        <SelectItem value="none" disabled>No eligible batches</SelectItem>
                      ) : (
                        availableBatches.map((b: any) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Only batches with eligible students are shown.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Title (Optional)</label>
                  <Input placeholder="e.g. Final Assessment Batch A" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} />
                </div>

                <div className="pt-4 p-4 bg-muted/30 rounded-lg border text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selected Students:</span>
                    <span className="font-bold">{selectedStudentIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    {/* Show estimated marks if possible, checking selected exam config */}
                    <span className="text-muted-foreground">Est. Total Marks:</span>
                    <span className="font-bold">
                      {(() => {
                        const config = examConfigs.find((c: any) => c.examNumber.toString() === selectedExamNumber)
                        return config ? config.totalQuestions * 2 : 'N/A'
                      })()}
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleScheduleExam} disabled={scheduling || selectedStudentIds.length === 0}>
                  {scheduling ? 'Scheduling...' : 'Schedule Exam'}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-t-4 border-t-muted">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Select Students</CardTitle>
                  <CardDescription>Only students eligible for Exam {selectedExamNumber} (Royalty Paid + Sequential Order)</CardDescription>
                </div>
                {eligibleStudents.length > 0 && (
                  <div className="text-xs text-right">
                    <span className="font-medium">{eligibleStudents.length}</span> eligible students found
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!selectedBatchId ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 border-2 border-dashed rounded-xl">
                    <Users className="w-10 h-10 mb-3 opacity-20" />
                    <p>Please select a Course and Batch first</p>
                  </div>
                ) : (eligibleStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 border-2 border-dashed rounded-xl">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-20" />
                    <p>No eligible students found for Exam {selectedExamNumber}</p>
                    <p className="text-xs mt-2">Check royalty status or previous exam completion.</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[50px] text-center">
                            <Checkbox
                              checked={eligibleStudents.length > 0 && selectedStudentIds.length === eligibleStudents.length}
                              onCheckedChange={() => {
                                if (selectedStudentIds.length === eligibleStudents.length) setSelectedStudentIds([])
                                else setSelectedStudentIds(eligibleStudents.map(s => s._id))
                              }}
                            />
                          </TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eligibleStudents.map((student: any) => (
                          <TableRow key={student._id} className="hover:bg-muted/30">
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedStudentIds.includes(student._id)}
                                onCheckedChange={() => toggleStudentSelection(student._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {student.rollNo || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <CheckCircle className="w-3 h-3" /> Eligible
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* FINAL EXAMS & RESCHEDULED TAB (Shared Design) */}
        {(activeTab === 'final' || activeTab === 'rescheduled') && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <Select value={filterCourseId} onValueChange={(value) => {
                    setFilterCourseId(value === 'all' ? '' : value)
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course: any) => (
                        <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Search Exams..."
                    className="w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => { setFilterCourseId('all'); setSearchQuery(''); setFilterStatus('all') }}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              {getFilteredExams('Final', activeTab === 'rescheduled').map((exam: any) => (
                <Card key={exam._id} className={`hover:shadow-lg transition-all border-l-4 overflow-hidden group ${activeTab === 'rescheduled' ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-muted/5 flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg group-hover:scale-105 transition-transform ${activeTab === 'rescheduled' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {activeTab === 'rescheduled' ? <RefreshCw className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-none">{exam.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50">
                                {exam.courseId?.name || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant={exam.status === 'Active' ? 'default' : 'secondary'} className={exam.status === 'Active' ? "bg-green-600 hover:bg-green-700 shadow-sm" : ""}>
                        {exam.status}
                      </Badge>
                    </div>

                    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Calendar className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                          <p className="font-medium text-sm">{new Date(exam.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Timer className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                          <p className="font-medium text-sm">{exam.duration} mins</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-full">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Students</p>
                          <p className="font-medium text-sm">{exam.systemAssignments?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-full">
                          <Award className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Marks</p>
                          <p className="font-medium text-sm">{exam.totalMarks}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getFilteredExams('Final', activeTab === 'rescheduled').length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                  No exams found for the selected filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                <Select value={attendanceFilterCourse} onValueChange={(val) => {
                  setAttendanceFilterCourse(val)
                  setAttendanceFilterExam('all') // Reset exam filter when course changes
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={attendanceFilterExam} onValueChange={setAttendanceFilterExam}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams
                      .filter(e => {
                        if (e.type !== 'Final') return false
                        // Show if we are past the "attendance start" time (Exam Start - 30 mins)
                        if (!e.date || !e.startTime) return false
                        const examDate = new Date(e.date)
                        const [hours, minutes] = e.startTime.split(':')
                        examDate.setHours(parseInt(hours), parseInt(minutes))
                        const attendanceStart = new Date(examDate.getTime() - 30 * 60000)
                        return new Date() >= attendanceStart
                      })
                      .filter(e => {
                        if (attendanceFilterCourse === 'all') return true
                        return (e.courseId?._id || e.courseId) === attendanceFilterCourse
                      })
                      .map((e: any) => (
                        <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Student..."
                    className="max-w-xs pl-9"
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => { setAttendanceFilterCourse('all'); setAttendanceFilterExam('all'); setAttendanceSearchQuery('') }}>Clear</Button>
              </CardContent>
            </Card>

            {(() => {
              const filteredExams = exams.filter(e => {
                if (e.type !== 'Final') return false

                // Time Check: Show only if attendance window has opened (Start - 30mins)
                if (!e.date || !e.startTime) return false
                const examDate = new Date(e.date)
                const [hours, minutes] = e.startTime.split(':')
                examDate.setHours(parseInt(hours), parseInt(minutes))
                const attendanceStart = new Date(examDate.getTime() - 30 * 60000) // 30 mins before

                if (new Date() < attendanceStart) return false

                // Course Filter
                if (attendanceFilterCourse !== 'all') {
                  if ((e.courseId?._id || e.courseId) !== attendanceFilterCourse) return false
                }

                // Exam Filter
                if (attendanceFilterExam !== 'all') {
                  if (e._id !== attendanceFilterExam) return false
                }

                // Search Filter
                if (attendanceSearchQuery) {
                  const query = attendanceSearchQuery.toLowerCase()
                  const titleMatch = e.title.toLowerCase().includes(query)
                  const studentMatch = e.systemAssignments?.some((sa: any) => sa.studentId?.name?.toLowerCase().includes(query))
                  return titleMatch || studentMatch
                }

                return true
              })

              if (filteredExams.length === 0) {
                return (
                  <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
                    <p className="text-muted-foreground">No attendance records found matching filters.</p>
                  </div>
                )
              }

              return (
                <div className="space-y-8">
                  {filteredExams.map((exam: any) => {
                    // Check if marking is still allowed (Now < StartTime)
                    const examDate = new Date(exam.date)
                    const [hours, minutes] = exam.startTime.split(':')
                    examDate.setHours(parseInt(hours), parseInt(minutes))
                    const isAttendanceOpen = new Date() < examDate

                    let displayedAssignments = exam.systemAssignments || []
                    if (attendanceSearchQuery) {
                      const query = attendanceSearchQuery.toLowerCase()
                      if (!exam.title.toLowerCase().includes(query)) {
                        displayedAssignments = displayedAssignments.filter((sa: any) => sa.studentId?.name?.toLowerCase().includes(query))
                      }
                    }

                    const total = displayedAssignments.length
                    const present = displayedAssignments.filter((sa: any) => sa.attended).length
                    const absent = total - present

                    if (total === 0) return null

                    return (
                      <div key={exam._id} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg leading-none text-foreground flex items-center gap-2">
                                {exam.title}
                                <Badge variant="outline" className="text-xs font-normal">
                                  {new Date(exam.date).toLocaleDateString()}
                                </Badge>
                              </h3>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {total} Students</span>
                                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> {present} Present</span>
                                <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3 h-3" /> {absent} Absent</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/40">
                              <TableRow>
                                <TableHead className="w-[300px] pl-6">Student</TableHead>
                                <TableHead>System</TableHead>
                                <TableHead>Attendance Status</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayedAssignments.map((sa: any, i: number) => (
                                <TableRow key={i} className="group hover:bg-muted/30 transition-colors">
                                  <TableCell className="pl-6 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                        {sa.studentId?.documents?.photo ? (
                                          <img src={sa.studentId.documents.photo} alt={sa.studentId.name} className="w-full h-full object-cover" />
                                        ) : (
                                          (sa.studentId?.name || 'U').charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm text-foreground">{sa.studentId?.name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{sa.studentId?.rollNo || 'No Info'}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${sa.attended ? 'bg-green-500' : 'bg-gray-300'} ${exam.status === 'Active' ? 'animate-pulse' : ''}`} />
                                      <span className="font-mono text-sm">{sa.systemName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {sa.attended ? (
                                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 gap-1.5 px-3 py-1">
                                        <CheckCircle className="w-3.5 h-3.5 fill-current" />
                                        Present
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-muted-foreground gap-1.5 px-3 py-1">
                                        <Ban className="w-3.5 h-3.5" />
                                        Absent
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    {!sa.attended && exam.status !== 'Completed' && isAttendanceOpen && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                        onClick={() => {
                                          fetch(`/api/exams/${exam._id}/mark-attendance`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ studentId: sa.studentId._id || sa.studentId })
                                          }).then(() => { toast.success('Marked Present'); fetchExams() })
                                        }}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                        Mark Present
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* ADMIT CARDS TAB */}
        {activeTab === 'admit' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                <Select value={admitFilterCourse} onValueChange={(val) => setAdmitFilterCourse(val)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={admitFilterExam} onValueChange={(val) => setAdmitFilterExam(val)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {Array.from(new Set(
                      admitCards
                        .filter((c: any) => {
                          if (admitFilterCourse === 'all') return true
                          const relatedExam = exams.find((e: any) => e.title === c.examTitle)
                          return relatedExam && (relatedExam.courseId?._id === admitFilterCourse || relatedExam.courseId === admitFilterCourse)
                        })
                        .map((c: any) => c.examTitle)
                    )).sort().map((title: any) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Student..."
                    className="max-w-xs pl-9"
                    value={admitSearchQuery}
                    onChange={(e) => setAdmitSearchQuery(e.target.value)}
                  />
                </div>

                <Button variant="outline" onClick={() => { setAdmitFilterCourse('all'); setAdmitFilterExam('all'); setAdmitSearchQuery('') }}>Clear</Button>
              </CardContent>
            </Card>

            {admitCards.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No admit cards generated yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  admitCards
                    .filter((c: any) => {
                      const nameMatch = !admitSearchQuery || c.studentName?.toLowerCase().includes(admitSearchQuery.toLowerCase())
                      const examMatch = admitFilterExam === 'all' || c.examTitle === admitFilterExam

                      let courseMatch = true
                      if (admitFilterCourse !== 'all') {
                        const relatedExam = exams.find((e: any) => e.title === c.examTitle)
                        if (relatedExam) {
                          courseMatch = relatedExam.courseId?._id === admitFilterCourse || relatedExam.courseId === admitFilterCourse
                        }
                      }
                      return nameMatch && examMatch && courseMatch
                    })
                    .reduce<Record<string, any[]>>((acc, card: any) => {
                      const examTitle = card.examTitle || 'Unknown Exam'
                      if (!acc[examTitle]) acc[examTitle] = []
                      acc[examTitle].push(card)
                      return acc
                    }, {})
                ).map(([examTitle, cards]) => (
                  <Card key={examTitle}>
                    <CardHeader className="py-3 bg-muted/5 border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <CardTitle className="text-base font-semibold">{examTitle}</CardTitle>
                        <Badge variant="secondary" className="ml-2 text-xs font-normal">
                          {cards.length} Students
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Student Name</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>System</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cards.map((card: any) => (
                            <TableRow key={card._id}>
                              <TableCell className="pl-6 font-medium">{card.studentName}</TableCell>
                              <TableCell className="text-muted-foreground">{card.rollNo}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{card.systemName}</Badge>
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
                                  variant="outline"
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
                    </CardContent>
                  </Card>
                ))}

                {admitCards.filter((c: any) => {
                  const nameMatch = !admitSearchQuery || c.studentName?.toLowerCase().includes(admitSearchQuery.toLowerCase())
                  const examMatch = admitFilterExam === 'all' || c.examTitle === admitFilterExam

                  let courseMatch = true
                  if (admitFilterCourse !== 'all') {
                    const relatedExam = exams.find((e: any) => e.title === c.examTitle)
                    if (relatedExam) {
                      courseMatch = relatedExam.courseId?._id === admitFilterCourse || relatedExam.courseId === admitFilterCourse
                    }
                  }
                  return nameMatch && examMatch && courseMatch
                }).length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                      No students/exams found matching your filters.
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                <Select value={resultFilterCourse} onValueChange={setResultFilterCourse}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={resultFilterExam} onValueChange={setResultFilterExam}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {Array.from(new Set(
                      results
                        .filter((r: any) => {
                          if (resultFilterCourse === 'all') return true
                          return r.examId?.courseId === resultFilterCourse || r.examId?.courseId?._id === resultFilterCourse
                        })
                        .map((r: any) => r.examId?.title)
                        .filter(Boolean)
                    )).sort().map((title: any) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Student..."
                    className="max-w-xs pl-9"
                    value={resultSearchQuery}
                    onChange={(e) => setResultSearchQuery(e.target.value)}
                  />
                </div>

                <Button variant="outline" onClick={() => { setResultFilterCourse('all'); setResultFilterExam('all'); setResultSearchQuery('') }}>Clear</Button>
              </CardContent>
            </Card>

            {results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No results available.</div>
            ) : (
              <div className="space-y-8">
                {(() => {
                  const filteredResults = results.filter((res: any) => {
                    const nameMatch = !resultSearchQuery || res.studentId?.name?.toLowerCase().includes(resultSearchQuery.toLowerCase())
                    const examMatch = resultFilterExam === 'all' || res.examId?.title === resultFilterExam

                    let courseMatch = true
                    if (resultFilterCourse !== 'all') {
                      courseMatch = res.examId?.courseId === resultFilterCourse || res.examId?.courseId?._id === resultFilterCourse
                    }

                    return nameMatch && examMatch && courseMatch
                  })

                  if (filteredResults.length === 0) {
                    return (
                      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        No results found matching your filters.
                      </div>
                    )
                  }

                  // Group by Exam Title
                  const groupedResults = filteredResults.reduce<Record<string, any[]>>((acc, res: any) => {
                    const examTitle = res.examId?.title || 'Unknown Exam'
                    if (!acc[examTitle]) acc[examTitle] = []
                    acc[examTitle].push(res)
                    return acc
                  }, {})

                  return Object.entries(groupedResults).map(([examTitle, examResults]) => (
                    <div key={examTitle} className="space-y-3">
                      <div className="flex items-center gap-3 px-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none text-foreground">{examTitle}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{examResults.length} students participated</p>
                        </div>
                      </div>

                      <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="w-[280px] pl-6">Student Name</TableHead>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Score Details</TableHead>
                              <TableHead className="w-[180px]">Performance</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right pr-6">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {examResults.map((res: any) => {
                              const percentage = Math.round((res.score / res.totalMarks) * 100) || 0
                              let gradeColor = 'bg-gray-100 text-gray-700 border-gray-200'
                              let statusText = 'Fail'

                              if (percentage >= 75) {
                                gradeColor = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                statusText = 'Distinction'
                              } else if (percentage >= 60) {
                                gradeColor = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                statusText = 'First Class'
                              } else if (percentage >= 35) {
                                gradeColor = 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                                statusText = 'Pass'
                              } else {
                                gradeColor = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                statusText = 'Fail'
                              }

                              return (
                                <TableRow key={res._id} className="group hover:bg-muted/30 transition-colors">
                                  <TableCell className="pl-6 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                        {res.studentId?.documents?.photo ? (
                                          <img src={res.studentId.documents.photo} alt={res.studentId.name} className="w-full h-full object-cover" />
                                        ) : (
                                          (res.studentId?.name || 'U').charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm text-foreground">{res.studentId?.name || 'Unknown User'}</p>
                                        <p className="text-xs text-muted-foreground">{res.studentId?.email}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground border-muted-foreground/20">
                                      {res.studentId?.rollNo || 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm">{res.score} <span className="text-muted-foreground font-normal">/ {res.totalMarks}</span></span>
                                      <span className="text-xs text-muted-foreground">Scored Marks</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-xs">
                                        <span className="font-medium">{percentage}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${percentage >= 35 ? 'bg-green-500' : 'bg-red-500'}`}
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 opacity-70" />
                                      {new Date(res.createdAt).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    <Badge variant="outline" className={`border ${gradeColor}`}>
                                      {statusText}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
