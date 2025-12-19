'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { BookOpen, Plus, Edit, Trash2, IndianRupee, Building2, Clock, TrendingUp, FileText, Book, Truck, Award, Wallet } from "lucide-react"

import Link from 'next/link'
import Loader from "@/components/ui/loader"

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  useEffect(() => {
    fetchCourses()
    fetchInstitutes()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
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

  const getInstituteCount = (courseId: string) => {
    return institutes.filter((inst: any) =>
      inst.courses?.some((c: any) => c._id === courseId)
    ).length
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      category: formData.get('category'),
      about: formData.get('about'),
      syllabus: formData.get('syllabus'),
      description: formData.get('description'),
      duration: formData.get('duration'),
      finalExamCount: Number(formData.get('finalExamCount')),
      baseFee: Number(formData.get('baseFee')),
      examFee: Number(formData.get('examFee')),
      bookPrice: Number(formData.get('bookPrice')),
      deliveryCharge: Number(formData.get('deliveryCharge')),
      certificateCharge: Number(formData.get('certificateCharge'))
    }

    try {
      const res = await fetch(`/api/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Course updated successfully')
        setEditOpen(false)
        fetchCourses()
      } else {
        toast.error('Failed to update course')
      }
    } catch (error) {
      toast.error('Failed to update course')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Course deleted successfully')
        fetchCourses()
      } else {
        toast.error('Failed to delete course')
      }
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  const totalCourses = courses.length
  const totalRevenue = courses.reduce((sum: number, c: any) => sum + ((c.baseFee || 0) + (c.examFee || 0)), 0)
  const avgPrice = totalCourses > 0 ? Math.round(totalRevenue / totalCourses) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Course Management" subtitle="Create and manage courses with pricing for institutes" />
        <Button className="gap-2" asChild>
          <Link href="/super-admin/courses/add">
            <Plus className="w-4 h-4" />
            Add New Course
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Course Price</p>
                <p className="text-2xl font-bold">₹{avgPrice.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Institutes</p>
                <p className="text-2xl font-bold">{institutes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {courses.map((course: any) => {
          const totalFee = (course.baseFee || 0) + (course.examFee || 0) + (course.bookPrice || 0) + (course.deliveryCharge || 0) + (course.certificateCharge || 60)
          const instituteCount = getInstituteCount(course._id)

          return (
            <Card key={course._id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold tracking-tight">{course.name}</h3>
                      <Badge variant="secondary" className="font-normal text-muted-foreground bg-muted/50 hover:bg-muted">
                        {course.code}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {instituteCount} Institutes
                      </span>
                      {course.duration && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {course.duration}
                          </span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{course.category || 'General'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setSelectedCourse(course)
                        setEditOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(course._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {course.description && (
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-3xl">
                    {course.description}
                  </p>
                )}

                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Base Fee</p>
                      </div>
                      <p className="text-lg font-semibold">₹{(course.baseFee || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Exam Fee</p>
                      </div>
                      <p className="text-lg font-semibold">₹{(course.examFee || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Book className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Book Price</p>
                      </div>
                      <p className="text-lg font-semibold">₹{(course.bookPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Truck className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Delivery</p>
                      </div>
                      <p className="text-lg font-semibold">₹{(course.deliveryCharge || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Award className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Cert. Charge</p>
                      </div>
                      <p className="text-lg font-semibold">₹{(course.certificateCharge || 60)}</p>
                    </div>
                    <div className="space-y-1 pl-4 border-l border-border/50">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Wallet className="w-3.5 h-3.5" />
                        <p className="text-xs font-medium uppercase tracking-wider">Total</p>
                      </div>
                      <p className="text-lg font-bold text-primary">₹{totalFee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Course Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedCourse.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-code">Course Code</Label>
                  <Input id="edit-code" name="code" defaultValue={selectedCourse.code} required />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input id="edit-category" name="category" defaultValue={selectedCourse.category} />
                </div>
                <div>
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input id="edit-duration" name="duration" defaultValue={selectedCourse.duration} />
                </div>
                <div>
                  <Label htmlFor="edit-finalExamCount">Final Exam Count</Label>
                  <Input id="edit-finalExamCount" name="finalExamCount" type="number" defaultValue={selectedCourse.finalExamCount || 1} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-about">About Course</Label>
                <Textarea id="edit-about" name="about" defaultValue={selectedCourse.about} rows={2} />
              </div>
              <div>
                <Label htmlFor="edit-syllabus">Syllabus</Label>
                <Textarea id="edit-syllabus" name="syllabus" defaultValue={selectedCourse.syllabus} rows={3} />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={selectedCourse.description} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-baseFee">Base Course Fee (₹)</Label>
                  <Input id="edit-baseFee" name="baseFee" type="number" defaultValue={selectedCourse.baseFee || 0} />
                </div>
                <div>
                  <Label htmlFor="edit-examFee">Exam Fee (₹)</Label>
                  <Input id="edit-examFee" name="examFee" type="number" defaultValue={selectedCourse.examFee || 0} />
                </div>
                <div>
                  <Label htmlFor="edit-bookPrice">Book Price (₹)</Label>
                  <Input id="edit-bookPrice" name="bookPrice" type="number" defaultValue={selectedCourse.bookPrice || 0} />
                </div>
                <div>
                  <Label htmlFor="edit-deliveryCharge">Delivery Charge (₹)</Label>
                  <Input id="edit-deliveryCharge" name="deliveryCharge" type="number" defaultValue={selectedCourse.deliveryCharge || 0} />
                </div>
                <div>
                  <Label htmlFor="edit-certificateCharge">Certificate Charge (₹)</Label>
                  <Input id="edit-certificateCharge" name="certificateCharge" type="number" defaultValue={selectedCourse.certificateCharge || 60} />
                </div>
              </div>
              <Button type="submit">Update Course</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}
