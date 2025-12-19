'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SimpleLineChart } from "@/components/lms/widgets"
import { BookOpen, FileText, Clock, Award, TrendingUp, Calendar, AlertCircle, Quote, Star, CheckCircle } from "lucide-react"
import Loader from "@/components/ui/loader"
import Link from 'next/link'

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    averageScore: 0,
    attendance: 85 // Mock default
  })
  const [courses, setCourses] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [upcomingExamsList, setUpcomingExamsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const studentId = user.id || user._id
      setStudentName(user.name || 'Student')

      const [userRes, examsRes, resultsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/exams'),
        fetch(`/api/exam-results?studentId=${studentId}`)
      ])

      const users = await userRes.json()
      const exams = await examsRes.json()
      const results = resultsRes.ok ? await resultsRes.json() : []

      const student = users.find((u: any) => u._id === studentId)

      const totalCourses = student?.courses?.length || 0
      const upcomingExams = exams.filter((e: any) => new Date(e.date) > new Date()).length
      const avgScore = results.length > 0
        ? results.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0) / results.length
        : 0

      setStats({
        totalCourses,
        completedCourses: 0,
        pendingAssignments: 3, // Mock
        upcomingExams,
        averageScore: Math.round(avgScore),
        attendance: 88 // Mock
      })

      setCourses(student?.courses || [])
      setExamResults(results)
      setUpcomingExamsList(exams.filter((e: any) => new Date(e.date) > new Date()).slice(0, 3))

    } catch (error) {
      console.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const performanceData = examResults.length > 0
    ? examResults.slice(0, 5).map((r: any) => ({
      label: new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.percentage || 0
    }))
    : [{ label: 'Start', value: 0 }, { label: 'Now', value: 0 }]

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hello, {studentName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your learning today.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-background shadow-sm border-blue-200 text-blue-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold mt-2">{stats.averageScore}%</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  Overall Performance
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Courses</p>
                <p className="text-3xl font-bold mt-2">{stats.totalCourses}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                  <BookOpen className="h-3 w-3" />
                  Active Enrollments
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <p className="text-3xl font-bold mt-2">{stats.attendance}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <CheckCircle className="h-3 w-3" />
                  Good Standing
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                <p className="text-3xl font-bold mt-2">{stats.upcomingExams}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                  <Calendar className="h-3 w-3" />
                  Next 30 Days
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {examResults.length > 0 ? (
              <SimpleLineChart data={performanceData} height={300} color="oklch(0.6 0.18 290)" />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                <p>No exam results available yet to show trends.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Quote className="h-5 w-5" />
                Daily Motivation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="italic text-lg text-muted-foreground border-l-4 border-blue-500 pl-4 py-2">
                "The beautiful thing about learning is that no one can take it away from you."
              </blockquote>
              <p className="text-right text-sm font-semibold mt-2 text-blue-600">- B.B. King</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Upcoming Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-2">
              {upcomingExamsList.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No upcoming exams scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingExamsList.map((exam, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded p-2 min-w-[60px]">
                        <span className="text-xs font-bold uppercase">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(exam.date).getDate()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exam.startTime} - {exam.endTime}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px] h-5">{exam.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            My Courses
          </CardTitle>
          <Link href="/student/courses" className="text-sm text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground col-span-full py-8">No courses enrolled</p>
            ) : (
              courses.slice(0, 3).map((course, idx) => (
                <div key={idx} className="group border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                        {course.courseId?.name?.charAt(0) || 'C'}
                      </div>
                      <Badge variant="secondary">{course.courseId?.code}</Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{course.courseId?.name || 'Course Name'}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {course.courseId?.description || 'No description available for this course.'}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
