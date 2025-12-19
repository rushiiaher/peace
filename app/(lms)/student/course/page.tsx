'use client'

import { useEffect, useState } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Clock, Calendar, Package } from "lucide-react"
import Loader from "@/components/ui/loader"

interface Course {
  courseId: {
    _id: string
    name: string
    code: string
    category: string
    duration: string
    description: string
    syllabus: string
  }
  booksIncluded: boolean
  enrolledAt: string
}

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (!studentId) {
      console.log('No studentId found')
      setLoading(false)
      return
    }

    console.log('Fetching courses for student:', studentId)

    Promise.all([
      fetch(`/api/students/${studentId}/courses`).then(r => r.json()),
      fetch(`/api/students/${studentId}/batches`).then(r => r.json())
    ]).then(([userCourses, batches]) => {
      console.log('User courses:', userCourses)
      console.log('Batches:', batches)

      const coursesFromUser = Array.isArray(userCourses) ? userCourses : []
      const coursesFromBatches = Array.isArray(batches) ? batches.map((b: any) => ({
        courseId: b.courseId,
        booksIncluded: false,
        enrolledAt: b.createdAt
      })) : []

      const allCourses = [...coursesFromUser, ...coursesFromBatches]
      const uniqueCourses = allCourses.filter((c, i, arr) =>
        arr.findIndex(x => x.courseId?._id === c.courseId?._id) === i
      )

      console.log('Final courses:', uniqueCourses)
      setCourses(uniqueCourses)
      setLoading(false)
    }).catch(err => {
      console.error('Error fetching courses:', err)
      setLoading(false)
    })
  }, [studentId])

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader title="My Courses" subtitle="Provides complete access to your learning content and resources." />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No courses enrolled yet</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="My Courses" subtitle="Provides complete access to your learning content and resources." />

      {courses.map((course) => (
        <Card key={course.courseId._id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 overflow-hidden group">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{course.courseId.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {course.courseId.code}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.courseId.duration}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {course.courseId.category && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">Category:</span>
                <Badge variant="secondary">{course.courseId.category}</Badge>
              </div>
            )}
            {course.courseId.description && (
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border">
                {course.courseId.description}
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {course.booksIncluded && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Package className="w-3 h-3" />
                    Books Included
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {course.courseId.syllabus && <Button size="sm" variant="outline">View Syllabus</Button>}
                <Button size="sm">Study Materials</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
