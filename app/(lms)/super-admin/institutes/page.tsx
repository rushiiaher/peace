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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import Link from 'next/link'
import { Building2, MapPin, Mail, Phone, BookOpen, IndianRupee, Plus, Edit, Trash2, Calendar, Search, MoreVertical, Loader2, PlayCircle, PauseCircle, Pencil, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState<any[]>([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [coursesOpen, setCoursesOpen] = useState(false)
  const [editCourseOpen, setEditCourseOpen] = useState(false)
  const [selectedInstitute, setSelectedInstitute] = useState<any>(null)
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchInstitutes()
  }, [debouncedSearch]) // Re-fetch when debounced search changes

  // Fetch initial courses once
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchInstitutes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)

      const res = await fetch(`/api/institutes?${params.toString()}`)
      const data = await res.json()
      setInstitutes(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch institutes')
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





  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institute?')) return

    try {
      const res = await fetch(`/api/institutes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Institute deleted successfully')
        fetchInstitutes()
      }
    } catch (error) {
      toast.error('Failed to delete institute')
    }
  }

  const handleAssignCourses = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/institutes/${selectedInstitute._id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: formData.get('courseId'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate')
        })
      })
      if (res.ok) {
        toast.success('Course assigned successfully')
        setCoursesOpen(false)
        fetchInstitutes()
        e.currentTarget.reset()
      }
    } catch (error) {
      toast.error('Failed to assign course')
    }
  }

  const handleEditCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate')
    }
    try {
      const res = await fetch(`/api/institutes/${selectedInstitute._id}/courses/${selectedCourseAssignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success('Course updated successfully')
        setEditCourseOpen(false)
        fetchInstitutes()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update course')
      }
    } catch (error) {
      toast.error('Failed to update course')
    }
  }

  const handleRemoveCourse = async (instituteId: string, courseAssignmentId: string) => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}/courses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseAssignmentId })
      })
      if (res.ok) {
        toast.success('Course removed successfully')
        fetchInstitutes()
      }
    } catch (error) {
      toast.error('Failed to remove course')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <SectionHeader title="Institute Management" subtitle="Add, manage, and assign courses to institutes" />

        {/* Sticky Search & Actions Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center transition-all">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city or code..."
              className="pl-9 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button asChild className="gap-2 shrink-0 shadow-lg shadow-primary/20">
            <Link href="/super-admin/institutes/add">
              <Plus className="w-4 h-4" />
              Add Institute
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      )}

      {!loading && institutes.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Institutes Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {searchQuery ? `No matches for "${searchQuery}"` : "Get started by adding your first institute."}
          </p>
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {institutes.map((inst: any) => (
            <Card key={inst._id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/20">
              <CardHeader className="pb-4 relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-bold text-foreground/90">{inst.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-muted/50">{inst.code}</Badge>
                      <Badge className={inst.status === 'Active' ? 'bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200' : 'bg-secondary text-secondary-foreground'}>
                        {inst.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {inst.location}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/super-admin/institutes/${inst._id}/edit`} className="cursor-pointer flex items-center w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedInstitute(inst); setCoursesOpen(true); }}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Assign Courses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(inst._id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Institute
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Courses
                    </p>
                    <p className="text-lg font-semibold">{inst.courses?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5" /> Pending
                    </p>
                    <p className={`text-lg font-semibold ${inst.pendingPayment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{inst.pendingPayment?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </p>
                    <p className="text-sm font-medium truncate" title={inst.email}>{inst.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {inst.phone}
                    </p>
                  </div>
                </div>

                {inst.courses?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                      Assigned Courses
                      <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{inst.courses.length}</span>
                    </h4>
                    <div className="space-y-2">
                      {inst.courses.map((courseAssignment: any) => (
                        <div key={courseAssignment._id} className="group/item flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent/30 transition-colors">
                          <div className="min-w-0 flex-1 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{courseAssignment.courseId?.name}</span>
                              <Badge variant={courseAssignment.enrollmentActive === false ? 'destructive' : 'default'} className="h-5 px-1.5 text-[10px]">
                                {courseAssignment.enrollmentActive === false ? 'Closed' : 'Open'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(courseAssignment.startDate).toLocaleDateString()} - {new Date(courseAssignment.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`h-7 w-7 ${courseAssignment.enrollmentActive === false ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/institutes/${inst._id}/courses/${courseAssignment._id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ enrollmentActive: !courseAssignment.enrollmentActive })
                                        })
                                        if (res.ok) {
                                          toast.success(courseAssignment.enrollmentActive === false ? 'Enrollment activated' : 'Enrollment deactivated')
                                          fetchInstitutes()
                                        }
                                      } catch (error) {
                                        toast.error('Failed to update status')
                                      }
                                    }}
                                  >
                                    {courseAssignment.enrollmentActive === false ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">{courseAssignment.enrollmentActive === false ? 'Activate Enrollment' : 'Pause Enrollment'}</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedInstitute(inst)
                                      setSelectedCourseAssignment(courseAssignment)
                                      setEditCourseOpen(true)
                                    }}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Edit Dates</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveCourse(inst._id, courseAssignment._id)}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Remove Course</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center bg-muted/20 rounded-lg border border-dashed text-sm text-muted-foreground">
                    No courses assigned yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      <Dialog open={coursesOpen} onOpenChange={setCoursesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Course - {selectedInstitute?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignCourses} className="space-y-4">
            <div>
              <Label htmlFor="courseId">Select Course</Label>
              <Select name="courseId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <Button type="submit">Assign Course</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course Assignment</DialogTitle>
          </DialogHeader>
          {selectedCourseAssignment && (
            <form onSubmit={handleEditCourse} className="space-y-4">
              <div>
                <Label>Course</Label>
                <p className="text-sm font-medium mt-1">{selectedCourseAssignment.courseId?.name}</p>
              </div>
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  name="startDate"
                  type="date"
                  defaultValue={new Date(selectedCourseAssignment.startDate).toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  name="endDate"
                  type="date"
                  defaultValue={new Date(selectedCourseAssignment.endDate).toISOString().split('T')[0]}
                  required
                />
              </div>
              <Button type="submit">Update Course</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
