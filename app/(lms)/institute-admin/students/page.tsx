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
import { Users, GraduationCap, Mail, Phone, Plus, Edit, Trash2, BookOpen, Calendar, User, Search, Filter, MapPin, CreditCard, UserCircle2 } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function InstituteStudentsPage() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [rollNo, setRollNo] = useState<string>('')
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
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
    }
  }, [instituteId])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users')
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



  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: 'student',
      instituteId,
      rollNo: formData.get('rollNo'),
      courses: [{
        courseId: formData.get('courseId'),
        booksIncluded: formData.get('booksIncluded') === 'true'
      }],
      phone: formData.get('phone'),
      address: formData.get('address'),
      dateOfBirth: formData.get('dateOfBirth'),
      guardianName: formData.get('guardianName'),
      guardianPhone: formData.get('guardianPhone'),
      status: 'Active'
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Student added successfully')
        fetchStudents()
        setRollNo('')
        setAddOpen(false)
      } else {
        const errorData = await res.json()
        console.error('Error response:', errorData)
        toast.error(errorData.error || 'Failed to add student')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to add student')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      dateOfBirth: formData.get('dateOfBirth'),
      guardianName: formData.get('guardianName'),
      guardianPhone: formData.get('guardianPhone')
    }

    const password = formData.get('password')
    if (password) data.password = password

    try {
      const res = await fetch(`/api/users/${selectedStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Student updated successfully')
        setEditOpen(false)
        fetchStudents()
      } else {
        toast.error('Failed to update student')
      }
    } catch (error) {
      toast.error('Failed to update student')
    }
  }

  const handleDelete = async (id: string) => {
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
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCourse = filterCourse === 'all' ||
      student.courses?.some((c: any) => (c.courseId?._id || c.courseId) === filterCourse)

    const matchesStatus = filterStatus === 'all' || student.status === filterStatus

    return matchesSearch && matchesCourse && matchesStatus
  })

  const totalStudents = students.length
  const activeStudents = students.filter((s: any) => s.status === 'Active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Student Management" subtitle="Add and manage students" />
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Account Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <UserCircle2 className="w-5 h-5" />
                    <h3>Account Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number</Label>
                      <Input id="rollNo" name="rollNo" value={rollNo || ''} onChange={(e) => setRollNo(e.target.value)} placeholder="ST-2024-001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="student@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="Active">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <User className="w-5 h-5" />
                    <h3>Personal Info</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" placeholder="+91..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" placeholder="City, State" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input id="guardianName" name="guardianName" />
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <BookOpen className="w-5 h-5" />
                    <h3>Academic</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="courseId">Assign Course</Label>
                      <Select name="courseId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((courseAssignment: any) => (
                            <SelectItem key={courseAssignment.courseId?._id} value={courseAssignment.courseId?._id}>
                              {courseAssignment.courseId?.name} ({courseAssignment.courseId?.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booksIncluded">Include Books</Label>
                      <Select name="booksIncluded" defaultValue="false">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes - Include Books</SelectItem>
                          <SelectItem value="false">No - Course Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input id="guardianPhone" name="guardianPhone" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Add Student</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Search & Filter</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, roll no, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by course" />
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <p>Showing {filteredStudents.length} of {totalStudents} students</p>
          {(searchQuery || filterCourse !== 'all' || filterStatus !== 'all') && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:bg-transparent hover:text-red-500"
              onClick={() => { setSearchQuery(''); setFilterCourse('all'); setFilterStatus('all') }}
            >Clear Filters</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-foreground">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredStudents.map((student: any) => {
            const getCourseDetails = () => {
              if (!student.courses || student.courses.length === 0) {
                return { display: 'Not enrolled in any course', isEmpty: true }
              }
              const courseList = student.courses.map((c: any) => {
                const name = c.courseId?.name || 'Unknown Course'
                const code = c.courseId?.code || ''
                return code ? `${name} (${code})` : name
              })
              return { display: courseList.join(' • '), isEmpty: false }
            }

            const courseInfo = getCourseDetails()

            return (
              <Card key={student._id} className="hover:shadow-lg transition-all hover:border-primary/50 group overflow-hidden py-0 border-muted/60 flex flex-col">
                <div className={`h-1.5 w-full ${student.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base line-clamp-1">{student.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{student.rollNo}</p>
                        </div>
                      </div>
                      <Badge variant={student.status === 'Active' ? 'default' : 'secondary'} className="shadow-none">
                        {student.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm pt-2">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{student.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className={`line-clamp-2 ${courseInfo.isEmpty ? 'italic opacity-70' : ''}`}>
                          {courseInfo.display}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-muted/30 p-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs font-medium bg-background"
                      onClick={() => {
                        setSelectedStudent(student)
                        setEditOpen(true)
                      }}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleDelete(student._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Roll Number</Label>
                  <Input value={selectedStudent.rollNo} disabled className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedStudent.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedStudent.email} required />
                </div>
                <div>
                  <Label htmlFor="edit-password">Password (New)</Label>
                  <Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current" />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedStudent.phone || ''} />
                </div>
                <div>
                  <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                  <Input
                    id="edit-dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toISOString().split('T')[0] : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" name="address" defaultValue={selectedStudent.address || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-guardianName">Guardian Name</Label>
                  <Input id="edit-guardianName" name="guardianName" defaultValue={selectedStudent.guardianName || ''} />
                </div>
                <div>
                  <Label htmlFor="edit-guardianPhone">Guardian Phone</Label>
                  <Input id="edit-guardianPhone" name="guardianPhone" defaultValue={selectedStudent.guardianPhone || ''} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-base font-semibold">Course Enrollments</Label>
                <div className="mt-3 space-y-4">
                  <div className="flex gap-2 p-3 bg-muted/40 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">Add New Course</Label>
                      <Select onValueChange={async (courseId) => {
                        try {
                          const res = await fetch(`/api/users/${selectedStudent._id}/courses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ courseId, booksIncluded: false })
                          })
                          if (res.ok) {
                            toast.success('Course added')
                            fetchStudents()
                            const updated = await res.json()
                            setSelectedStudent(updated)
                          } else {
                            toast.error('Failed to add course')
                          }
                        } catch (error) {
                          toast.error('Failed to add course')
                        }
                      }}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select course to enroll" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses
                            .filter((ca: any) => !selectedStudent.courses?.some((c: any) => (c.courseId?._id || c.courseId) === ca.courseId?._id))
                            .map((courseAssignment: any) => (
                              <SelectItem key={courseAssignment.courseId?._id} value={courseAssignment.courseId?._id}>
                                {courseAssignment.courseId?.name} ({courseAssignment.courseId?.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedStudent.courses?.length === 0 || !selectedStudent.courses ? (
                      <p className="text-sm text-muted-foreground italic">No courses enrolled yet</p>
                    ) : (
                      selectedStudent.courses?.map((course: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                          <div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{course.courseId?.name || 'Unknown Course'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">Books: {course.booksIncluded ? 'Yes' : 'No'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${selectedStudent._id}/courses/${course.courseId?._id || course.courseId}`, {
                                  method: 'DELETE'
                                })
                                if (res.ok) {
                                  toast.success('Course removed')
                                  fetchStudents()
                                  const updated = await res.json()
                                  setSelectedStudent(updated)
                                } else {
                                  toast.error('Failed to remove course')
                                }
                              } catch (error) {
                                toast.error('Failed to remove course')
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Student</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
