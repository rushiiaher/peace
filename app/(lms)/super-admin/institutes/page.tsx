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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState<any[]>([])
  const [courses, setCourses] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
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
    // Keep the current list on screen while re-fetching (search / after an action);
    // only the very first load shows skeletons.
    setRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)

      const res = await fetch(`/api/institutes?${params.toString()}`)
      const data = await res.json()
      setInstitutes(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch institutes')
    } finally {
      setRefreshing(false)
      setInitialLoading(false)
    }
  }

  // Surface the server's error message instead of failing silently on !res.ok
  const errorFrom = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => ({}))
    return data?.error || fallback
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





  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/institutes/${deleteTarget._id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${deleteTarget.name} deleted`)
        setDeleteTarget(null)
        fetchInstitutes()
      } else {
        toast.error(await errorFrom(res, 'Failed to delete institute'))
      }
    } catch (error) {
      toast.error('Failed to delete institute')
    } finally {
      setDeleting(false)
    }
  }

  // Shared by both dialogs — the API accepts any dates, so guard here
  const invalidRange = (start: any, end: any) => {
    if (!start || !end) return false
    return new Date(String(end)) < new Date(String(start))
  }

  const handleAssignCourses = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    if (invalidRange(formData.get('startDate'), formData.get('endDate'))) {
      toast.error('End date must be on or after the start date')
      return
    }
    setSubmitting(true)
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
        form.reset()
      } else {
        toast.error(await errorFrom(res, 'Failed to assign course'))
      }
    } catch (error) {
      toast.error('Failed to assign course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate')
    }
    if (invalidRange(payload.startDate, payload.endDate)) {
      toast.error('End date must be on or after the start date')
      return
    }
    setSubmitting(true)
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
        toast.error(await errorFrom(res, 'Failed to update course'))
      }
    } catch (error) {
      toast.error('Failed to update course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveCourse = async (instituteId: string, courseAssignmentId: string) => {
    setBusyCourseId(courseAssignmentId)
    try {
      const res = await fetch(`/api/institutes/${instituteId}/courses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseAssignmentId })
      })
      if (res.ok) {
        toast.success('Course removed successfully')
        fetchInstitutes()
      } else {
        toast.error(await errorFrom(res, 'Failed to remove course'))
      }
    } catch (error) {
      toast.error('Failed to remove course')
    } finally {
      setBusyCourseId(null)
    }
  }

  const handleToggleEnrollment = async (instituteId: string, courseAssignment: any) => {
    const activating = courseAssignment.enrollmentActive === false
    setBusyCourseId(courseAssignment._id)
    try {
      const res = await fetch(`/api/institutes/${instituteId}/courses/${courseAssignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentActive: activating })
      })
      if (res.ok) {
        toast.success(activating ? 'Enrollment activated' : 'Enrollment paused')
        fetchInstitutes()
      } else {
        toast.error(await errorFrom(res, 'Failed to update status'))
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setBusyCourseId(null)
    }
  }

  const availableCourses = courses.filter((c: any) =>
    !selectedInstitute?.courses?.some((assignment: any) => (assignment.courseId?._id || assignment.courseId) === c._id)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <SectionHeader title="Institute Management" subtitle="Add, manage, and assign courses to institutes" />

        {/* Sticky Search & Actions Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b flex flex-col sm:flex-row gap-4 justify-between sm:items-center transition-all">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              aria-label="Search institutes"
              placeholder="Search by name, city or code..."
              className="pl-9 pr-9 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {refreshing && !initialLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {!refreshing && searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {!initialLoading && (
              <p className="text-sm text-muted-foreground whitespace-nowrap" aria-live="polite">
                {institutes.length} institute{institutes.length === 1 ? '' : 's'}
              </p>
            )}
            <Button asChild className="gap-2 shadow-lg shadow-primary/20">
              <Link href="/super-admin/institutes/add">
                <Plus className="w-4 h-4" />
                Add Institute
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      ) : institutes.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Institutes Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {searchQuery ? `No matches for "${searchQuery}"` : "Get started by adding your first institute."}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          ) : (
            <Button asChild className="gap-2">
              <Link href="/super-admin/institutes/add">
                <Plus className="w-4 h-4" />
                Add Institute
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 transition-opacity ${refreshing ? 'opacity-60' : ''}`} aria-busy={refreshing}>
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
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${inst.name}`} className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setDeleteTarget(inst)}>
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

                          {/* focus-within keeps the cluster visible for keyboard users */}
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 sm:group-focus-within/item:opacity-100 transition-opacity">
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={busyCourseId === courseAssignment._id}
                                    aria-label={courseAssignment.enrollmentActive === false ? 'Activate enrollment' : 'Pause enrollment'}
                                    className={`h-7 w-7 ${courseAssignment.enrollmentActive === false ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                    onClick={() => handleToggleEnrollment(inst._id, courseAssignment)}
                                  >
                                    {busyCourseId === courseAssignment._id
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : courseAssignment.enrollmentActive === false ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">{courseAssignment.enrollmentActive === false ? 'Activate Enrollment' : 'Pause Enrollment'}</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Edit dates for ${courseAssignment.courseId?.name || 'course'}`}
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
                                    disabled={busyCourseId === courseAssignment._id}
                                    aria-label={`Remove ${courseAssignment.courseId?.name || 'course'}`}
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
        <DialogContent className="max-w-xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl">Assign Course</DialogTitle>
            <p className="text-sm text-muted-foreground">Assign a new course to {selectedInstitute?.name}</p>
          </DialogHeader>
          <form onSubmit={handleAssignCourses} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Select Course</Label>
                <Select name="courseId" required disabled={availableCourses.length === 0}>
                  <SelectTrigger id="courseId">
                    <SelectValue placeholder={availableCourses.length === 0 ? 'No courses left to assign' : 'Select course to assign'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Every course is already assigned to this institute.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setCoursesOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || availableCourses.length === 0}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? 'Assigning...' : 'Assign Course'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl">Edit Course Assignment</DialogTitle>
          </DialogHeader>
          {selectedCourseAssignment && (
            <form onSubmit={handleEditCourse} className="space-y-6">
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 border border-dashed rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Course Name</Label>
                  <p className="text-base font-semibold mt-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {selectedCourseAssignment.courseId?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      name="startDate"
                      type="date"
                      defaultValue={new Date(selectedCourseAssignment.startDate).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input
                      id="edit-endDate"
                      name="endDate"
                      type="date"
                      defaultValue={new Date(selectedCourseAssignment.endDate).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setEditCourseOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? 'Saving...' : 'Update Course'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the institute ({deleteTarget?.code}) along with its course assignments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Institute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
