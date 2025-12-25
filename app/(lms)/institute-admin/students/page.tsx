'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, GraduationCap, Mail, Phone, Plus, Edit, Trash2, BookOpen, Filter, Search } from "lucide-react"
import Loader from "@/components/ui/loader"
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function InstituteStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterBatch, setFilterBatch] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchStudents()
      fetchCourses()
      fetchBatches()
    }
  }, [instituteId])

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/users?instituteId=${instituteId}&role=student`)
      const data = await res.json()
      const instituteStudents = data.filter((u: any) => u.role === 'student' && u.instituteId === instituteId)
      setStudents(instituteStudents)
    } catch (error) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}/courses`)
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    }
  }

  const fetchBatches = async () => {
    try {
      const res = await fetch(`/api/batches?instituteId=${instituteId}`)
      const data = await res.json()
      setBatches(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch batches")
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Student deleted successfully')
        fetchStudents()
      } else {
        toast.error('Failed to delete student')
      }
    } catch (error) {
      toast.error('Failed to delete student')
    }
  }

  if (loading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = searchQuery === '' ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCourse = filterCourse === 'all' ||
      student.courses?.some((c: any) => (c.courseId?._id || c.courseId) === filterCourse)

    const matchesBatch = filterBatch === 'all' || (() => {
      const batch = batches.find(b => b._id === filterBatch)
      return batch?.students?.some((s: any) => (s._id || s) === student._id)
    })()

    const matchesStatus = filterStatus === 'all' || student.status === filterStatus

    return matchesSearch && matchesCourse && matchesStatus && matchesBatch
  })

  // Reset batch filter when course changes
  const handleCourseChange = (val: string) => {
    setFilterCourse(val)
    setFilterBatch('all')
  }

  const totalStudents = students.length
  const activeStudents = students.filter((s: any) => s.status === 'Active').length

  const availableBatches = filterCourse === 'all'
    ? []
    : batches.filter(b => (b.courseId?._id || b.courseId) === filterCourse)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Student Management" subtitle="Add and manage students" />
        <Button asChild className="gap-2">
          <Link href="/institute-admin/students/add">
            <Plus className="w-4 h-4" />Add Student
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-blue-950 dark:text-blue-100">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-green-950 dark:text-green-100">{activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses assigned</p>
                <p className="text-2xl font-bold text-purple-950 dark:text-purple-100">{courses.length}</p>
              </div>
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
          {(searchQuery || filterCourse !== 'all' || filterStatus !== 'all' || filterBatch !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50"
              onClick={() => { setSearchQuery(''); setFilterCourse('all'); setFilterBatch('all'); setFilterStatus('all') }}
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
              placeholder="Search by name, roll no, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 focus:bg-background transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((ca: any) => (
                  <SelectItem key={ca.courseId?._id} value={ca.courseId?._id}>
                    {ca.courseId?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBatch} onValueChange={setFilterBatch} disabled={filterCourse === 'all'}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                <SelectValue placeholder={filterCourse === 'all' ? "Select Course First" : "All Batches"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {availableBatches.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background/50">
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
          <p>Showing <strong>{filteredStudents.length}</strong> of <strong>{totalStudents}</strong> students</p>
        </div>
      </div>

      <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-muted/20 border-dashed m-2 rounded-lg border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-foreground">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[250px] pl-4">Student Name</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Enrolled Courses</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student: any) => {
                const getCourseDetails = () => {
                  if (!student.courses || student.courses.length === 0) {
                    return { display: 'Not enrolled', isEmpty: true }
                  }
                  const courseList = student.courses.map((c: any) => {
                    const name = c.courseId?.name || 'Unknown'
                    const code = c.courseId?.code || ''
                    return code ? `${name} (${code})` : name
                  })
                  return { display: courseList.join(', '), isEmpty: false }
                }

                const courseInfo = getCourseDetails()

                return (
                  <TableRow key={student._id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                          {student.documents?.photo ? (
                            <img
                              src={student.documents.photo}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{student.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground border-muted-foreground/20">
                        {student.rollNo || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3 text-primary/70" />
                          <span className="truncate max-w-[150px]" title={student.email}>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 text-primary/70" />
                          <span>{student.phone || '-'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 max-w-[200px]">
                        <BookOpen className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/70 shrink-0" />
                        <span className={`text-sm truncate ${courseInfo.isEmpty ? 'italic text-muted-foreground/60' : 'text-muted-foreground'}`} title={courseInfo.display}>
                          {courseInfo.display}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.studentFullyPaid ? (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-green-200 text-green-700 bg-green-50">
                          Paid Inst.
                        </Badge>
                      ) : (student.studentPaidAmount || 0) > 0 ? (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-blue-200 text-blue-700 bg-blue-50">
                          Paid Inst: ₹{(student.studentPaidAmount || 0).toLocaleString()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-yellow-200 text-yellow-700 bg-yellow-50">
                          Not Paid Inst.
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`
                          ${student.status === 'Active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          } border shadow-none
                        `}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full"
                          title="Edit Student"
                        >
                          <Link href={`/institute-admin/students/${student._id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                          onClick={(e) => handleDelete(student._id, e)}
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
