'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Users, Calendar, Trash2, Package, Check, BookOpen, Clock, UserPlus, Filter, Search } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [globalCourses, setGlobalCourses] = useState<any[]>([]) // For creating new batch
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  // Create Form State
  const [newBatchCourse, setNewBatchCourse] = useState("")
  const [newBatchName, setNewBatchName] = useState("")
  const [newBatchStart, setNewBatchStart] = useState("")
  const [newBatchEnd, setNewBatchEnd] = useState("")
  const [newBatchPrice, setNewBatchPrice] = useState("")

  // Manage Student State
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [includeBooks, setIncludeBooks] = useState("false")
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchData()
    }
  }, [instituteId])

  const fetchData = async () => {
    try {
      const [batchesRes, usersRes, coursesRes] = await Promise.all([
        fetch(`/api/batches?instituteId=${instituteId}`),
        fetch('/api/users'),
        fetch('/api/courses')
      ])

      const batchesData = await batchesRes.json()
      const usersData = await usersRes.json()
      const coursesData = await coursesRes.json()

      setBatches(Array.isArray(batchesData) ? batchesData : [])
      setAllStudents(usersData.filter((u: any) => u.role === 'student' && u.instituteId === instituteId))
      setGlobalCourses(coursesData || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBatchCourse || !newBatchName || !newBatchStart || !newBatchEnd || !newBatchPrice) {
      toast.error('All fields are required')
      return
    }

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId,
          courseId: newBatchCourse,
          name: newBatchName,
          startDate: newBatchStart,
          endDate: newBatchEnd,
          institutePrice: Number(newBatchPrice)
        })
      })

      if (res.ok) {
        toast.success('Batch created successfully')
        setCreateOpen(false)
        fetchData()
        // Reset form
        setNewBatchCourse("")
        setNewBatchName("")
        setNewBatchStart("")
        setNewBatchEnd("")
        setNewBatchPrice("")
      } else {
        toast.error('Failed to create batch')
      }
    } catch (error) {
      toast.error('Error creating batch')
    }
  }

  // Pre-fill batch name based on course
  useEffect(() => {
    if (newBatchCourse && newBatchStart) {
      const course = globalCourses.find(c => c._id === newBatchCourse)
      const year = new Date(newBatchStart).getFullYear()
      if (course) {
        setNewBatchName(`${course.code} - ${year} Batch`)
        // Auto-fill price if available?
        setNewBatchPrice((course.baseFee + course.examFee + 60 + (course.bookPrice || 0) + (course.deliveryCharge || 0) + 2000).toString()) // Default suggested price
      }
    }
  }, [newBatchCourse, newBatchStart, globalCourses])

  const getEnrolledStudents = (batch: any) => {
    if (!batch) return []
    // Match students who have the same Course ID as the batch
    return allStudents.filter(s =>
      s.courses?.some((c: any) =>
        (c.courseId?._id || c.courseId) === (batch.courseId?._id || batch.courseId)
      )
    )
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId || !selectedBatch) return
    try {
      const res = await fetch(`/api/users/${selectedStudentId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedBatch.courseId._id || selectedBatch.courseId,
          booksIncluded: includeBooks === 'true'
        })
      })
      if (res.ok) {
        toast.success('Student enrolled successfully')
        setSelectedStudentId("")
        fetchData()
      } else {
        toast.error('Failed to enroll student')
      }
    } catch (error) {
      toast.error('Error enrolling student')
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedBatch || !confirm("Remove student from this batch?")) return
    try {
      const res = await fetch(`/api/users/${studentId}/courses/${selectedBatch.courseId._id || selectedBatch.courseId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Student removed')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to remove student')
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>

  const activeBatchesCount = batches.filter(b => b.status === 'Active').length

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchQuery === '' ||
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.courseId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.courseId?.code?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || batch.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader title="Batch Management" subtitle="Create and manage your course batches" />
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Create New Batch
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Batches</p>
              <p className="text-2xl font-bold">{batches.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Active Students</p>
              <p className="text-2xl font-bold">{batches.reduce((sum, b) => sum + (b.status === 'Active' ? getEnrolledStudents(b).length : 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Batches</p>
              <p className="text-2xl font-bold">{activeBatchesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Search & Filter</h3>
          </div>
          {(searchQuery || filterStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50"
              onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by batch name, course name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 focus:bg-background transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-1">
          <p>Showing <strong>{filteredBatches.length}</strong> of <strong>{batches.length}</strong> batches</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => {
          const isActive = batch.status === 'Active'
          const enrolledCount = getEnrolledStudents(batch).length
          const isEnded = new Date(batch.endDate) < new Date()

          return (
            <Card key={batch._id} className="group overflow-hidden hover:shadow-lg transition-all border-muted/60">
              <div className={`h-1.5 w-full ${isActive && !isEnded ? 'bg-indigo-500' : 'bg-gray-400'}`} />
              <CardContent className="p-0">
                <div className="p-5 bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-background">
                      {batch.courseId?.code || '---'}
                    </Badge>
                    <Badge variant={isActive && !isEnded ? 'default' : 'secondary'}>
                      {isEnded ? 'Finished' : batch.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{batch.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{batch.courseId?.name}</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(batch.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary p-1.5 rounded">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Enrolled</p>
                        <p className="font-bold">{enrolledCount}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBatch(batch)
                      setManageOpen(true)
                    }}>
                      Manage <UserPlus className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Batch Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>Set up a new course session/batch.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBatch} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={newBatchCourse} onValueChange={setNewBatchCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {globalCourses.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={newBatchStart} onChange={e => setNewBatchStart(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={newBatchEnd} onChange={e => setNewBatchEnd(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input value={newBatchName} onChange={e => setNewBatchName(e.target.value)} placeholder="e.g. FSWD - 2026 Batch" required />
            </div>

            <div className="space-y-2">
              <Label>Institute Fee (₹)</Label>
              <Input type="number" value={newBatchPrice} onChange={e => setNewBatchPrice(e.target.value)} placeholder="Total course fee" required />
              <p className="text-[10px] text-muted-foreground">Suggested base price automatically calculated.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">Create Batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Manage Enrollment</DialogTitle>
            <DialogDescription>{selectedBatch?.name}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Enrolled List */}
            <div className="flex-1 border-r flex flex-col">
              <div className="p-3 bg-muted/20 border-b font-medium text-xs uppercase text-muted-foreground flex justify-between">
                <span>Enrolled Students ({getEnrolledStudents(selectedBatch).length})</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {getEnrolledStudents(selectedBatch).length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">No students enrolled</div>
                )}
                {getEnrolledStudents(selectedBatch).map(student => (
                  <div key={student._id} className="flex justify-between items-center p-2 rounded border bg-card/50">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveStudent(student._id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Student Form */}
            <div className="w-[300px] bg-muted/5 p-4 flex flex-col gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Add Student</h4>
                <p className="text-xs text-muted-foreground">Enroll an existing student into this batch.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search student..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {allStudents
                        .filter(s => !(s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === (selectedBatch?.courseId?._id || selectedBatch?.courseId)))
                        .map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Options</Label>
                  <Select value={includeBooks} onValueChange={setIncludeBooks}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Tuition Only</SelectItem>
                      <SelectItem value="true">Include Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddStudent} disabled={!selectedStudentId} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Enroll
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
