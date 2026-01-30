'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" - Removed
import { toast } from "sonner"
import { Calendar, FileCheck, Timer, Clock, Award, Users, AlertCircle, RefreshCw, Trash2, Edit, CheckCircle, XCircle, MoreVertical, MapPin, ClipboardList } from "lucide-react"
import Link from 'next/link'
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function SuperAdminExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [qbs, setQbs] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourseId, setFilterCourseId] = useState('')
  const [activeTab, setActiveTab] = useState("DPP")

  // Enhanced filters for Final Exams
  const [finalExamInstituteId, setFinalExamInstituteId] = useState('')
  const [finalExamCourseId, setFinalExamCourseId] = useState('')
  const [finalExamBatchStatus, setFinalExamBatchStatus] = useState('all') // all, active, inactive
  const [finalExamBatchId, setFinalExamBatchId] = useState('')

  // Enhanced filters for Rescheduled Exams (same pattern)
  const [reschInstituteId, setReschInstituteId] = useState('')
  const [reschCourseId, setReschCourseId] = useState('')
  const [reschBatchStatus, setReschBatchStatus] = useState('all')
  const [reschBatchId, setReschBatchId] = useState('')

  const [reschFilterCourse, setReschFilterCourse] = useState('all')
  const [reschFilterInst, setReschFilterInst] = useState('all')
  const [reschFilterStatus, setReschFilterStatus] = useState('all')

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useEffect(() => {
    fetchExams()
    fetchCourses()
    fetchInstitutes()
    fetchBatches()
    fetchQBs()
    fetchPendingRequestsCount()
  }, [])

  const fetchPendingRequestsCount = async () => {
    try {
      const res = await fetch('/api/exams/reschedule-requests?status=Pending')
      const data = await res.json()
      setPendingRequestsCount(Array.isArray(data) ? data.length : 0)
    } catch (e) {
      console.error('Failed to fetch requests count')
    }
  }

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch exams')
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    }
  }

  const fetchInstitutes = async () => {
    try {
      const res = await fetch('/api/institutes')
      const data = await res.json()
      setInstitutes(data)
    } catch (error) {
      toast.error('Failed to fetch institutes')
    }
  }

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches')
      const data = await res.json()
      setBatches(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch batches', error)
      setBatches([])
    }
  }

  const fetchQBs = async () => {
    try {
      const res = await fetch('/api/question-banks')
      const data = await res.json()
      setQbs(data)
    } catch (error) {
      toast.error('Failed to fetch question banks')
    }
  }

  const handleEditExam = (exam: any) => {
    setSelectedExam(exam)
    setEditOpen(true)
  }

  const handleUpdateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      title: formData.get('title'),
      date: formData.get('date'),
      duration: Number(formData.get('duration')),
      totalMarks: Number(formData.get('totalMarks')),
      status: formData.get('status')
    }

    try {
      const res = await fetch(`/api/exams/${selectedExam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Exam updated successfully')
        setEditOpen(false)
        fetchExams()
      }
    } catch (error) {
      toast.error('Failed to update exam')
    }
  }

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Exam deleted successfully')
        await fetchExams()
        await fetchQBs()
      }
    } catch (error) {
      toast.error('Failed to delete exam')
    }
  }

  const handleUndoReschedule = async (examId: string) => {
    if (!confirm('Are you sure you want to undo all reschedules for this exam? This will revert all rescheduled students back to the original exam date and time.')) return

    try {
      const res = await fetch('/api/exams/undo-reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId })
      })

      if (res.ok) {
        toast.success('All reschedules undone successfully')
        fetchExams()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to undo reschedules')
      }
    } catch (error) {
      toast.error('Failed to undo reschedules')
    }
  }

  const filterByType = (type: string) => exams.filter((e: any) => e.type === type)

  // Helper to get ALL courses relevant to an institute (Allocated + Historical from Exams)
  const getInstituteCourses = (instId: string) => {
    if (!instId || instId === 'all') return []

    const inst: any = institutes.find((i: any) => i._id === instId)

    // 1. Currently allocated courses
    const allocatedIds = inst?.courses?.map((c: any) =>
      (c.courseId?._id || c.courseId)
    ).filter(Boolean) || []

    // 2. Historical courses from exams
    const historicalIds = exams
      .filter((e: any) => (e.instituteId?._id || e.instituteId) === instId)
      .map((e: any) => (e.courseId?._id || e.courseId))
      .filter(Boolean)

    // Combine unique
    const uniqueIds = Array.from(new Set([...allocatedIds, ...historicalIds]))

    return uniqueIds
      .map(id => courses.find((c: any) => c._id === id))
      .filter(Boolean)
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Exam Management" subtitle="Schedule and manage exams" />

      <div className="flex gap-2">
        <Button variant="outline" asChild className="gap-2">
          <Link href="/super-admin/exams/requests">
            <ClipboardList className="w-4 h-4" />
            Manage Requests
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2 relative">
          <Link href="/super-admin/exams/requests">
            <div className="relative">
              <ClipboardList className="w-4 h-4 mr-2 inline-block" />
              Manage Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center w-full pb-4">
          <AnimatedTabsProfessional
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "DPP", label: "DPP", count: filterByType('DPP').length },
              { id: "Final", label: "Final Exams", count: filterByType('Final').filter((e: any) => !e.title.includes('(Rescheduled)')).length },
              { id: "Rescheduled", label: "Rescheduled Exams", count: filterByType('Final').filter((e: any) => e.title.includes('(Rescheduled)')).length },
            ]}
          />
        </div>

        {activeTab === "DPP" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Course</Label>
                    <Select value={filterCourseId} onValueChange={(value) => {
                      setFilterCourseId(value === 'all' ? '' : value)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course: any) => (
                          <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Source / Topic</Label>
                    <Select onValueChange={(value) => {
                      const qb = qbs.find((q: any) => q._id === value)
                      setSearchQuery(qb ? qb.topic : '')
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" onClick={() => setSearchQuery('')}>All Sources</SelectItem>
                        {qbs
                          .filter((qb: any) => !filterCourseId || qb.courseId?._id === filterCourseId)
                          .map((qb: any) => (
                            <SelectItem key={qb._id} value={qb._id}>{qb.topic}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Search</Label>
                    <Input
                      placeholder="Search title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Button variant="ghost" onClick={() => { setFilterCourseId(''); setSearchQuery('') }} className="mb-0.5 text-muted-foreground hover:text-foreground">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
            {filterByType('DPP')
              .filter((exam: any) => !filterCourseId || exam.courseId?._id === filterCourseId)
              .filter((exam: any) => !searchQuery || exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((exam: any) => (
                <Card key={exam._id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-muted/5 flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-105 transition-transform">
                            <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-none">{exam.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
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
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                          <p className="font-medium text-sm">{new Date(exam.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                          <Timer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                          <p className="font-medium text-sm">{exam.duration} mins</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Questions</p>
                          <p className="font-medium text-sm">{exam.questions?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Marks</p>
                          <p className="font-medium text-sm">{exam.totalMarks}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/10 border-t flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-blue-50 text-blue-700 border-blue-200"
                        onClick={() => handleEditExam(exam)}
                        disabled={exam.status === 'Completed'}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteExam(exam._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {activeTab === "Rescheduled" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  {/* 1. Institute Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Institute</Label>
                    <Select
                      value={reschInstituteId}
                      onValueChange={(value) => {
                        setReschInstituteId(value)
                        setReschCourseId('')
                        setReschBatchId('')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Institute" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Institutes</SelectItem>
                        {institutes.map((inst: any) => (
                          <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Course Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Course</Label>
                    <Select
                      value={reschCourseId}
                      onValueChange={(value) => {
                        setReschCourseId(value)
                        setReschBatchId('')
                      }}
                      disabled={!reschInstituteId || reschInstituteId === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {reschInstituteId && reschInstituteId !== 'all' &&
                          getInstituteCourses(reschInstituteId).map((course: any) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Batch Status */}
                  <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Status</Label>
                    <Select
                      value={reschBatchStatus}
                      onValueChange={setReschBatchStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Batch Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. Batch Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Batch</Label>
                    <Select
                      value={reschBatchId}
                      onValueChange={setReschBatchId}
                      disabled={!reschCourseId || reschCourseId === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {batches
                          .filter((batch: any) => {
                            if (reschInstituteId && reschInstituteId !== 'all') {
                              if ((batch.instituteId?._id || batch.instituteId) !== reschInstituteId) return false
                            }
                            if (reschCourseId && reschCourseId !== 'all') {
                              if ((batch.courseId?._id || batch.courseId) !== reschCourseId) return false
                            }
                            if (reschBatchStatus !== 'all') {
                              if (reschBatchStatus === 'active' && !batch.isActive) return false
                              if (reschBatchStatus === 'inactive' && batch.isActive) return false
                            }
                            return true
                          })
                          .map((batch: any) => (
                            <SelectItem key={batch._id} value={batch._id}>
                              {batch.name} {!batch.isActive ? '(Inactive)' : ''}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Button */}
                  <Button
                    variant="ghost"
                    className="mb-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setReschInstituteId('')
                      setReschCourseId('')
                      setReschBatchStatus('all')
                      setReschBatchId('')
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {filterByType('Final')
              .filter((exam: any) => exam.title.includes('(Rescheduled)'))
              .filter((exam: any) => {
                // Filter by Institute
                if (reschInstituteId && reschInstituteId !== 'all') {
                  if ((exam.instituteId?._id || exam.instituteId) !== reschInstituteId) return false
                }
                // Filter by Course
                if (reschCourseId && reschCourseId !== 'all') {
                  if ((exam.courseId?._id || exam.courseId) !== reschCourseId) return false
                }
                // Filter by Batch
                if (reschBatchId && reschBatchId !== 'all') {
                  const hasBatchStudents = exam.systemAssignments?.some((sa: any) => {
                    const student = sa.studentId
                    if (student && student.batchId) {
                      return (student.batchId._id || student.batchId) === reschBatchId
                    }
                    return false
                  })
                  if (!hasBatchStudents) return false
                }
                return true
              })
              .map((exam: any) => {
                const rescheduledCount = exam.systemAssignments?.length || 0

                // Correct Duration and Marks Logic
                // Correct Duration and Marks Logic
                const fullCourse = courses.find((c: any) => c._id === (exam.courseId?._id || exam.courseId));

                // Try to get exam number from object, or infer from title (e.g., "Exam 2 (...)" -> 2)
                let examNum = exam.examNumber;
                if (!examNum) {
                  const match = exam.title.match(/Exam\s*(\d+)/i);
                  if (match) examNum = parseInt(match[1]);
                  else examNum = 1; // Default to 1 if not found
                }

                const config = fullCourse?.examConfigurations?.find((conf: any) => Number(conf.examNumber) === Number(examNum));
                const displayDuration = config?.duration || exam.duration || 60;
                // Marks = Total Questions * 2 (Assuming standard 2 marks per question)
                const displayMarks = config?.totalQuestions ? config.totalQuestions * 2 : (exam.totalMarks || 100);

                return (
                  <Card key={exam._id} className="hover:shadow-lg transition-all border-l-4 border-l-orange-500 overflow-hidden group">
                    <CardContent className="p-0">
                      {/* Header Section */}
                      <div className="p-4 border-b bg-muted/5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
                              <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg leading-tight text-foreground/90">{exam.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs font-medium border-muted-foreground/20 text-muted-foreground bg-transparent">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {exam.instituteId?.name}
                                </Badge>
                                <Badge variant="outline" className="text-xs font-medium border-muted-foreground/20 text-muted-foreground bg-transparent">
                                  {exam.courseId?.name}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status & Counts */}
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={exam.status === 'Active' ? 'default' : (exam.status === 'Completed' ? 'secondary' : 'outline')}
                            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide
                              ${exam.status === 'Active' ? 'bg-green-600 hover:bg-green-700 shadow-sm' : ''}
                              ${exam.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${exam.status === 'Completed' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                            `}
                          >
                            {exam.status}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{rescheduledCount} Students</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Info Grid */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Date & Time */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Scheduled Date</p>
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Calendar className="w-4 h-4" /></div>
                            <span className="font-semibold text-sm">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Clock className="w-4 h-4" /></div>
                            <span className="font-medium text-sm">{exam.startTime} - {exam.endTime}</span>
                          </div>
                        </div>

                        {/* Duration & Marks */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Exam Details</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Timer className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{displayDuration} mins</span>
                            </div>
                            <div className="w-px h-4 bg-border"></div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{displayMarks} Marks</span>
                            </div>
                          </div>
                        </div>


                      </div>

                      {/* Footer Actions */}
                      <div className="px-5 py-3 bg-muted/10 border-t flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          {/* Optional: Add creation date or other meta info here */}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 ${exam.attendanceEnabled ? 'text-green-700 border-green-200 hover:bg-green-50' : 'text-primary border-primary/20 hover:bg-primary/5'}`}
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/exams/${exam._id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ attendanceEnabled: !exam.attendanceEnabled })
                                })
                                if (res.ok) {
                                  const updated = await res.json()
                                  toast.success(updated.attendanceEnabled ? '✅ Attendance Enabled' : 'Attendance Disabled')
                                  await fetchExams()
                                } else {
                                  toast.error('Failed to update')
                                }
                              } catch (error) {
                                toast.error('Failed to update')
                              }
                            }}
                          >
                            {exam.attendanceEnabled ? 'Disable Attendance' : 'Enable Attendance'}
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 shadow-sm border border-border/50"
                            onClick={() => window.location.href = `/super-admin/exams/reschedule?examId=${exam._id}&view=rescheduled`}
                          >
                            View Students
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => window.location.href = `/super-admin/exams/${exam._id}/edit`}
                            disabled={exam.status === 'Completed'}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Edit Schedule
                          </Button>

                          {exam.status !== 'Completed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none"
                              onClick={() => handleUndoReschedule(exam._id)}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            }
          </div>
        )}

        {activeTab === "Final" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  {/* 1. Institute Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Institute</Label>
                    <Select
                      value={finalExamInstituteId}
                      onValueChange={(value) => {
                        setFinalExamInstituteId(value)
                        setFinalExamCourseId('') // Reset course when institute changes
                        setFinalExamBatchId('') // Reset batch when institute changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Institute" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Institutes</SelectItem>
                        {institutes.map((inst: any) => (
                          <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Course Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Course</Label>
                    <Select
                      value={finalExamCourseId}
                      onValueChange={(value) => {
                        setFinalExamCourseId(value)
                        setFinalExamBatchId('') // Reset batch when course changes
                      }}
                      disabled={!finalExamInstituteId || finalExamInstituteId === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {finalExamInstituteId && finalExamInstituteId !== 'all' &&
                          getInstituteCourses(finalExamInstituteId).map((course: any) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Batch Status */}
                  <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Status</Label>
                    <Select
                      value={finalExamBatchStatus}
                      onValueChange={setFinalExamBatchStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Batch Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. Batch Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Batch</Label>
                    <Select
                      value={finalExamBatchId}
                      onValueChange={setFinalExamBatchId}
                      disabled={!finalExamCourseId || finalExamCourseId === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {batches
                          .filter((batch: any) => {
                            // Filter by institute
                            if (finalExamInstituteId && finalExamInstituteId !== 'all') {
                              if ((batch.instituteId?._id || batch.instituteId) !== finalExamInstituteId) return false
                            }
                            // Filter by course
                            if (finalExamCourseId && finalExamCourseId !== 'all') {
                              if ((batch.courseId?._id || batch.courseId) !== finalExamCourseId) return false
                            }
                            // Filter by batch status
                            if (finalExamBatchStatus !== 'all') {
                              if (finalExamBatchStatus === 'active' && !batch.isActive) return false
                              if (finalExamBatchStatus === 'inactive' && batch.isActive) return false
                            }
                            return true
                          })
                          .map((batch: any) => (
                            <SelectItem key={batch._id} value={batch._id}>
                              {batch.name} {!batch.isActive ? '(Inactive)' : ''}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Button */}
                  <Button
                    variant="ghost"
                    className="mb-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setFinalExamInstituteId('')
                      setFinalExamCourseId('')
                      setFinalExamBatchStatus('all')
                      setFinalExamBatchId('')
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
            {filterByType('Final')
              .filter((exam: any) => !exam.title.includes('(Rescheduled)'))
              .filter((exam: any) => {
                // Filter by Institute
                if (finalExamInstituteId && finalExamInstituteId !== 'all') {
                  if ((exam.instituteId?._id || exam.instituteId) !== finalExamInstituteId) return false
                }
                // Filter by Course
                if (finalExamCourseId && finalExamCourseId !== 'all') {
                  if ((exam.courseId?._id || exam.courseId) !== finalExamCourseId) return false
                }
                // Filter by Batch (if exam has batch info)
                if (finalExamBatchId && finalExamBatchId !== 'all') {
                  // Check if any section in the exam has students from the selected batch
                  const hasBatchStudents = exam.systemAssignments?.some((sa: any) => {
                    const student = sa.studentId
                    if (student && student.batchId) {
                      return (student.batchId._id || student.batchId) === finalExamBatchId
                    }
                    return false
                  })
                  if (!hasBatchStudents) return false
                }
                return true
              })
              .map((exam: any) => (
                <Card key={exam._id} className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-muted/5 flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-105 transition-transform">
                            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-none">{exam.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                <MapPin className="w-3 h-3 mr-1" />
                                {exam.instituteId?.name || 'N/A'}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-normal border-muted text-muted-foreground">
                                {exam.courseId?.name || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {exam.systemAssignments?.some((sa: any) => sa.isRescheduled) && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Rescheduled
                          </Badge>
                        )}
                        <Badge variant={exam.status === 'Active' ? 'default' : 'secondary'} className={exam.status === 'Active' ? "bg-green-600 hover:bg-green-700 shadow-sm" : ""}>{exam.status}</Badge>
                      </div>
                    </div>

                    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                          <p className="font-medium text-sm">{new Date(exam.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{exam.startTime} - {exam.endTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-full">
                          <Timer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                          <p className="font-medium text-sm">{exam.duration} mins</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Questions</p>
                          <p className="font-medium text-sm">{exam.totalQuestions || exam.questions?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Marks</p>
                          <p className="font-medium text-sm">{exam.totalMarks}</p>
                        </div>
                      </div>
                    </div>

                    {exam.multiSection && (
                      <div className="px-5 pb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded text-sm flex items-center gap-2 border border-blue-100 dark:border-blue-900/50">
                          <MoreVertical className="w-4 h-4 text-blue-600" />
                          <p className="font-medium text-blue-900 dark:text-blue-300">Multi-Section Exam: {exam.sections?.length || 0} sections configured</p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-muted/10 border-t flex flex-wrap justify-end gap-2">


                      <div className="flex justify-center">
                        {!exams.some((e: any) => e.title === `${exam.title} (Rescheduled)`) ? (
                          exam.status !== 'Completed' ? (
                            <span className="text-xs text-muted-foreground self-center px-2 py-1 bg-muted rounded border opacity-70 cursor-not-allowed">Finish Exam First</span>
                          ) : (
                            (exam.systemAssignments?.length > 0) ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.location.href = `/super-admin/exams/reschedule?examId=${exam._id}`}
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Reschedule
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground self-center px-2 py-1 bg-muted rounded">No students</span>
                            )
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground self-center px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">Already rescheduled</span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/super-admin/exams/${exam._id}/edit`}
                        disabled={exam.status === 'Completed'}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit Schedule
                      </Button>


                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )
        }
      </div >

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Exam Details</DialogTitle>
            <DialogDescription>
              Update the exam information below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <form onSubmit={handleUpdateExam}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">
                    Exam Title
                  </Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={selectedExam.title}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-date" className="text-right">
                    Exam Date
                  </Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="datetime-local"
                    defaultValue={new Date(selectedExam.date).toISOString().slice(0, 16)}
                    className="col-span-3"
                    required
                  />
                </div>

                {activeTab !== 'Rescheduled' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-duration" className="text-right">
                        Duration (m)
                      </Label>
                      <Input
                        id="edit-duration"
                        name="duration"
                        type="number"
                        defaultValue={selectedExam.duration}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-totalMarks" className="text-right">
                        Total Marks
                      </Label>
                      <Input
                        id="edit-totalMarks"
                        name="totalMarks"
                        type="number"
                        defaultValue={selectedExam.totalMarks}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-status" className="text-right">
                        Status
                      </Label>
                      <div className="col-span-3">
                        <Select name="status" defaultValue={selectedExam.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}
