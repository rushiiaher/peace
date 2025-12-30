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
import { Plus, Users, Calendar, Trash2, Package, Check, BookOpen, Clock, UserPlus, Filter, Search, Edit } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  // Create Form State
  const [newBatchCourse, setNewBatchCourse] = useState("")
  const [newBatchName, setNewBatchName] = useState("")
  const [newBatchStart, setNewBatchStart] = useState("")
  const [newBatchEnd, setNewBatchEnd] = useState("")

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
        fetch(`/api/batches?instituteId=${instituteId}&limit=100`),
        fetch('/api/users?limit=100'),
        fetch(`/api/institutes/${instituteId}/courses`)
      ])

      const batchesData = await batchesRes.json()
      const usersData = await usersRes.json()
      const coursesData = await coursesRes.json()

      setBatches(Array.isArray(batchesData) ? batchesData : [])
      setAllStudents(usersData.filter((u: any) => u.role === 'student' && u.instituteId === instituteId))

      // Map correctly to get the Course object from the Institute's course list
      // Map correctly to get the Course object from the Institute's course list
      const formattedCourses = Array.isArray(coursesData)
        ? coursesData.map((alloc: any) => alloc.courseId).filter(Boolean)
        : []

      // Deduplicate courses to prevent key errors if multiple assignments exist
      const uniqueCourses = Array.from(new Map(formattedCourses.map((item: any) => [item._id, item])).values())

      setAvailableCourses(uniqueCourses)

    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBatchCourse || !newBatchName || !newBatchStart || !newBatchEnd) {
      toast.error('All fields are required')
      return
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(newBatchStart);
    const endDate = new Date(newBatchEnd);

    if (startDate < today) {
      toast.error('Start Date cannot be in the past. Please enter a valid future date.');
      return;
    }

    if (endDate <= startDate) {
      toast.error('End Date must be after Start Date. Please check your dates.');
      return;
    }

    // Check for duplicate batch name
    const isDuplicate = batches.some(b => b.name.toLowerCase() === newBatchName.trim().toLowerCase());
    if (isDuplicate) {
      toast.error('A batch with this name already exists. Please choose a unique name.');
      return;
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
          endDate: newBatchEnd
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
      } else {
        toast.error('Failed to create batch')
      }
    } catch (error) {
      toast.error('Error creating batch')
    }
  }

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !newBatchName || !newBatchEnd) return;

    try {
      const res = await fetch(`/api/batches/${selectedBatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBatchName,
          endDate: newBatchEnd
        })
      });

      if (res.ok) {
        toast.success('Batch updated successfully');
        setUpdateOpen(false);
        fetchData();
      } else {
        toast.error('Failed to update batch');
      }
    } catch (error) {
      toast.error('Error updating batch');
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? This will deallocate all students from this course!')) return;

    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Batch deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete batch');
      }
    } catch (error) {
      toast.error('Error deleting batch');
    }
  }

  // Pre-fill batch name based on course & generate unique batch number
  useEffect(() => {
    if (newBatchCourse && newBatchStart) {
      const course = availableCourses.find((c: any) => c._id === newBatchCourse)
      const year = new Date(newBatchStart).getFullYear()

      if (course) {
        // 1. Get accurate count of batches for this course
        const existingBatchesForCourse = batches.filter(b =>
          (b.courseId?._id === newBatchCourse || b.courseId === newBatchCourse)
        )
        const nextBatchNum = existingBatchesForCourse.length + 1

        // 2. Derive Short Code
        let shortCode = course.code ? course.code.trim().toUpperCase() : ''
        if (!shortCode && course.name) {
          // Generate simplistic short code if missing (e.g. "Full Stack" -> "FS")
          shortCode = course.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 4)
        }

        // 3. Construct Name: "CODE - Batch N (YEAR)"
        setNewBatchName(`${shortCode} - Batch ${nextBatchNum} (${year})`)
      }
    }
  }, [newBatchCourse, newBatchStart, availableCourses, batches])

  const getEnrolledStudents = (batch: any) => {
    if (!batch || !batch.students) return []
    // Use the actual students array populated from the backend
    return batch.students
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId || !selectedBatch) return
    try {
      // UPDATED: Use the Batch API to ensure Payment record creation and Batch linking
      const res = await fetch(`/api/batches/${selectedBatch._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
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
      // UPDATED: Use Batch API to consistently remove student from Batch and User course list
      const res = await fetch(`/api/batches/${selectedBatch._id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
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

  // DERIVED STATE: Always get the fresh batch object from the main list using the ID
  const managedBatch = selectedBatch ? batches.find(b => b._id === selectedBatch._id) : null

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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedBatch(batch);
                        setNewBatchName(batch.name);
                        setNewBatchEnd(new Date(batch.endDate).toISOString().split('T')[0]);
                        setUpdateOpen(true);
                      }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleDeleteBatch(batch._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedBatch(batch)
                        setManageOpen(true)
                      }}>
                        Manage <UserPlus className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Batch Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Create New Batch</DialogTitle>
            </div>
            <DialogDescription>
              Define a new academic session. Ensure dates are accurate for attendance tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBatch} className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Course</Label>
              <Select value={newBatchCourse} onValueChange={setNewBatchCourse}>
                <SelectTrigger className="w-full h-11 bg-muted/5 [&>span]:truncate">
                  <SelectValue placeholder="Identify the course..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c: any) => (
                    <SelectItem key={c._id} value={c._id} className="cursor-pointer">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Starts On <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={newBatchStart}
                    onChange={e => setNewBatchStart(e.target.value)}
                    required
                    className="pl-9 h-11 bg-muted/5"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Ends On <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={newBatchEnd}
                    onChange={e => setNewBatchEnd(e.target.value)}
                    required
                    className="pl-9 h-11 bg-muted/5"
                    min={newBatchStart || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md flex gap-2 items-start text-xs text-blue-700 dark:text-blue-300">
              <div className="mt-0.5"><Clock className="w-3.5 h-3.5" /></div>
              <div>
                <p className="font-semibold mb-0.5">Date Guide</p>
                <p>Start date must be today or in the future. End date must be strictly after the start date.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Batch Name</Label>
              <Input
                value={newBatchName}
                onChange={e => setNewBatchName(e.target.value)}
                placeholder="e.g. FSWD - 2026 Batch"
                required
                className="h-11 bg-muted/5"
              />
              <p className="text-[10px] text-muted-foreground">
                This name will be displayed on student certificates and ID cards.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="min-w-[120px]">Create Batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Batch Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBatch} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input value={newBatchName} onChange={e => setNewBatchName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={newBatchEnd} onChange={e => setNewBatchEnd(e.target.value)} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">Update Batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Manage Enrollment</DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-foreground">{managedBatch?.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full border">{getEnrolledStudents(managedBatch).length} Students Enrolled</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 divide-x">
            {/* Enrolled List - Left Side (Wider) */}
            <div className="flex-1 flex flex-col bg-background">
              {/* Header Row */}
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5 pl-2">Student Details</div>
                <div className="col-span-5">Contact Info</div>
                <div className="col-span-2 text-center">Action</div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-0">
                {getEnrolledStudents(managedBatch).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 gap-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm">No students currently enrolled in this batch.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {getEnrolledStudents(managedBatch).map((student: any) => (
                      <div key={student._id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30 transition-colors group">
                        {/* Student Details */}
                        <div className="col-span-5 flex items-center gap-3 pl-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border flex items-center justify-center overflow-hidden shrink-0">
                            {student.documents?.photo ? (
                              <img src={student.documents.photo} alt={student.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="font-bold text-gray-500 text-xs">{student.name?.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate text-foreground">{student.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground bg-white">
                                {student.rollNo || 'No Roll #'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="col-span-5 min-w-0 flex flex-col justify-center text-sm">
                          <div className="flex items-center gap-1.5 truncate text-muted-foreground" title={student.email}>
                            <span className="truncate">{student.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-muted-foreground mt-0.5">
                            <span className="text-xs">{student.phone || 'No Phone'}</span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="col-span-2 flex justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-all"
                            onClick={() => handleRemoveStudent(student._id)}
                            title="Remove from Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Student Form - Right Side (Narrower) */}
            <div className="w-[320px] bg-muted/5 flex flex-col border-l shadow-inner z-10">
              <div className="p-5 space-y-6">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" /> Add New Student
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Enroll a student into this batch.</p>
                </div>

                <div className="space-y-4 bg-background p-4 rounded-lg border shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Select Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Search by name or roll no..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px] w-[280px]">
                        {allStudents
                          .filter(s => !(s.courses || []).some((c: any) => (c.courseId?._id || c.courseId) === (managedBatch?.courseId?._id || managedBatch?.courseId)))
                          .map(s => (
                            <SelectItem key={s._id} value={s._id} className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold">
                                  {s.name?.substring(0, 1)}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-xs font-medium truncate max-w-[180px]">{s.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{s.rollNo}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Enrollment Options</Label>
                    <Select value={includeBooks} onValueChange={setIncludeBooks}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Tuition Only</SelectItem>
                        <SelectItem value="true">Include Books & Materials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddStudent} disabled={!selectedStudentId} className="w-full mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Enroll Student
                  </Button>
                </div>
              </div>

              <div className="mt-auto p-4 border-t bg-muted/10">
                <p className="text-[10px] text-muted-foreground text-center">
                  Adding a student will automatically generate a pending fee record.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
