'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleLineChart } from "@/components/lms/widgets"
import { toast } from "sonner"
import { Building2, Users, BookOpen, DollarSign, TrendingUp, AlertCircle, GraduationCap, Award, Headphones, IndianRupee, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`
    return `₹${amount.toLocaleString()}`
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
  if (!data) return <div className="p-6">No data available</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Complete system overview and analytics</p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Institutes</p>
                <p className="text-3xl font-bold mt-2">{data.overview.totalInstitutes}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3" />
                  Active & Running
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold mt-2">{data.overview.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-2">Across all institutes</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold mt-2">{data.overview.totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-2">Available courses</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">{formatAmount(data.overview.totalRevenue)}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  {formatAmount(data.overview.pendingRevenue)} pending
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <IndianRupee className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-3xl font-bold mt-2">{formatAmount(data.overview.netProfit)}</p>
                <p className="text-xs text-muted-foreground mt-2">Income - Expenses</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <IndianRupee className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                <p className="text-3xl font-bold mt-2">{data.overview.totalDPPs + data.overview.totalFinalExams}</p>
                <p className="text-xs text-muted-foreground mt-2">{data.overview.totalDPPs} DPPs + {data.overview.totalFinalExams} Finals</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-pink-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-3xl font-bold mt-2">{data.overview.avgScore}%</p>
                <p className="text-xs text-muted-foreground mt-2">Student performance</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold mt-2">{data.overview.openTickets}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  Needs attention
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Headphones className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={data.trends.revenue.map((t: any) => ({ label: t.month, value: t.revenue }))} height={250} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Student Enrollment Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={data.trends.enrollment.map((t: any) => ({ label: t.month, value: t.students }))} height={250} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Institute Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.institutes.map((inst: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.courses} courses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="font-bold text-blue-600">{inst.students}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-bold text-green-600">{formatAmount(inst.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              Course Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.courses.map((course: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-medium">{course.name}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {course.students} students
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recent Student Enrollments
              </p>
              <div className="space-y-2">
                {data.recent.students.slice(0, 3).map((student: any) => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{student.rollNo}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Recent Payments
              </p>
              <div className="space-y-2">
                {data.recent.payments.slice(0, 3).map((payment: any) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <p className="font-medium text-sm">{payment.studentId?.name || 'Student'}</p>
                      <p className="text-xs text-muted-foreground">{payment.courseId?.name || 'Course'}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatAmount(payment.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
