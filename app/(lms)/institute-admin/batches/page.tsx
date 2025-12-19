'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Users, Search, BookOpen, Calendar, MoreVertical, Edit, UserPlus, X, GraduationCap, CheckCircle2, AlertCircle, TrendingUp, IndianRupee, Trash2, Package } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function BatchesPage() {
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [includeBooks, setIncludeBooks] = useState<string>("false")
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchBatches()
      fetchCourses()
      fetchStudents()
    }
  }, [instituteId])

  const fetchBatches = async () => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}`)
      const institute = await res.json()
      setBatches(institute.courses || [])
    } catch (error) {
      toast.error('Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}`)
      const institute = await res.json()
      setCourses(institute.courses || [])
    } catch (error) {
      toast.error('Failed to fetch courses')
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setStudents(data.filter((u: any) => u.role === 'student' && u.instituteId === instituteId))
    } catch (error) {
      toast.error('Failed to fetch students')
    }
  }



  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      courseId: formData.get('courseId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status')
    }

    try {
      const res = await fetch(`/api/batches/${selectedBatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Batch updated successfully')
        setEditOpen(false)
        fetchBatches()
      }
    } catch (error) {
      toast.error('Failed to update batch')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalBatches = batches.length
  const totalEnrolled = students.length
  const activeBatches = batches.filter((b: any) => b.enrollmentActive !== false).length

  return (
    <div className="space-y-6">
      <SectionHeader title="Batch Management" subtitle="Organize students into batches for structured learning" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
                <p className="text-2xl font-bold">{totalBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold">{activeBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {batches.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-foreground">No batches assigned</p>
          </div>
        ) : (
          batches.map((courseAssignment: any) => {
            const assignedStudents = students.filter((s: any) =>
              (s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === courseAssignment.courseId?._id)
            )
            const isActive = courseAssignment.enrollmentActive !== false

            return (
              <Card key={courseAssignment._id} className="hover:shadow-lg transition-all hover:border-primary/50 group overflow-hidden border-muted/60 flex flex-col">
                <div className={`h-1.5 w-full ${isActive ? 'bg-indigo-500' : 'bg-red-500'}`} />
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">
                          {courseAssignment.courseId?.code}
                        </Badge>
                        <h3 className="font-bold text-lg leading-tight">{courseAssignment.courseId?.name}</h3>
                      </div>
                      <Badge variant={isActive ? 'default' : 'destructive'} className="shadow-sm">
                        {isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {new Date(courseAssignment.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {new Date(courseAssignment.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Enrolled</p>
                            <p className="text-sm font-bold">{assignedStudents.length} Students</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-muted/30">
                    <Button
                      className="w-full gap-2"
                      variant={isActive ? "default" : "secondary"}
                      onClick={() => {
                        setSelectedBatch(courseAssignment)
                        setEditOpen(true)
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Manage Students
                    </Button>
                    {!isActive && (
                      <p className="text-xs text-center text-red-500 mt-2 font-medium">Enrollment locked</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/10">
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="text-xl">Manage Batch Enrollment</DialogTitle>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold text-foreground">{selectedBatch?.courseId?.name}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{selectedBatch?.courseId?.code}</span>
            </div>
          </DialogHeader>

          {selectedBatch && (
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left Column: List */}
              <div className="flex-1 flex flex-col min-h-0 border-r bg-muted/5">
                <div className="p-4 border-b bg-background/50 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    Enrolled Students
                  </h3>
                  <Badge variant="secondary" className="px-2 py-0.5 h-6">
                    {students.filter((s: any) => (s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === selectedBatch.courseId?._id)).length}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {students.filter((s: any) => (s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === selectedBatch.courseId?._id)).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
                      <div className="p-4 bg-muted/50 rounded-full mb-3">
                        <Users className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm">No students enrolled yet</p>
                    </div>
                  ) : (
                    students
                      .filter((s: any) => (s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === selectedBatch.courseId?._id))
                      .map((student: any) => {
                        const courseEnrollment = (student.courses || []).find((c: any) => (c.courseId?._id || c.courseId) === selectedBatch.courseId?._id)
                        return (
                          <div key={student._id} className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                                {student.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-none truncate">{student.name}</p>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">{student.rollNo}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {courseEnrollment?.booksIncluded && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                  <Package className="w-3 h-3" /> Books
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={async () => {
                                  if (!confirm("Remove student from this batch?")) return;
                                  try {
                                    const res = await fetch(`/api/users/${student._id}/courses/${selectedBatch.courseId._id}`, {
                                      method: 'DELETE'
                                    })
                                    if (res.ok) {
                                      toast.success('Student removed')
                                      fetchStudents()
                                    }
                                  } catch (error) {
                                    toast.error('Failed to remove student')
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>

              {/* Right Column: Add */}
              <div className="w-full md:w-[320px] shrink-0 bg-background p-4 md:p-6 border-l overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-1 text-sm">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Add New Student
                    </h3>
                    <p className="text-xs text-muted-foreground">Select a student to enroll them into this batch.</p>
                  </div>

                  {selectedBatch.enrollmentActive === false ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 text-sm text-center">
                      <p className="font-medium">Enrollment Closed</p>
                      <p className="text-xs mt-1 opacity-80">This batch is not accepting new students.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Student</Label>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select student..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {students
                              .filter((s: any) => !(s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === selectedBatch.courseId?._id))
                              .map((student: any) => (
                                <SelectItem key={student._id} value={student._id}>
                                  {student.name} ({student.rollNo})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          * Only shows students not already enrolled.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Study Material</Label>
                        <div className="bg-muted/30 p-1 rounded-lg border">
                          <Select value={includeBooks} onValueChange={setIncludeBooks}>
                            <SelectTrigger className="w-full border-0 bg-transparent shadow-none h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Include Books & Materials</SelectItem>
                              <SelectItem value="false">Tuition Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button className="w-full mt-4" onClick={async () => {
                        if (!selectedStudentId) {
                          toast.error('Please select a student')
                          return
                        }
                        try {
                          const res = await fetch(`/api/users/${selectedStudentId}/courses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              courseId: selectedBatch.courseId._id,
                              booksIncluded: includeBooks === 'true'
                            })
                          })
                          if (res.ok) {
                            toast.success('Student enrolled successfully')
                            setSelectedStudentId("") // Reset selection
                            fetchStudents()
                          } else {
                            toast.error('Failed to add student')
                          }
                        } catch (error) {
                          toast.error('Failed to add student')
                        }
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Enroll Student
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
