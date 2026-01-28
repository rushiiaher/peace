'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleLineChart } from "@/components/lms/widgets"
import { Users, BookOpen, DollarSign, Calendar, TrendingUp, AlertCircle, Phone, ArrowUpRight, GraduationCap, Building, IndianRupee } from "lucide-react"
import Loader from "@/components/ui/loader"
import Link from 'next/link'

export default function InstituteAdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    collectedFees: 0,
    pendingFees: 0,
    upcomingExams: 0,
    activeBatches: 0,
    totalEnquiries: 0
  })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([])
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  const [revenueData, setRevenueData] = useState<any[]>([])

  useEffect(() => {
    if (instituteId) {
      fetchDashboardData()
      fetchRevenueData()
    }
  }, [instituteId])

  const fetchRevenueData = async () => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}/revenue`)
      if (res.ok) {
        setRevenueData(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch revenue data')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [usersRes, instituteRes, paymentsRes, examsRes, enquiriesRes] = await Promise.allSettled([
        fetch('/api/users'),
        fetch(`/api/institutes/${instituteId}`),
        fetch(`/api/fee-payments?instituteId=${instituteId}`),
        fetch('/api/exams'),
        fetch(`/api/enquiries?instituteId=${instituteId}`)
      ])

      const users = usersRes.status === 'fulfilled' ? await usersRes.value.json() : []
      const institute = instituteRes.status === 'fulfilled' ? await instituteRes.value.json() : {}
      const payments = paymentsRes.status === 'fulfilled' ? await paymentsRes.value.json() : []
      const exams = examsRes.status === 'fulfilled' ? await examsRes.value.json() : []
      const enquiries = enquiriesRes.status === 'fulfilled' ? await enquiriesRes.value.json() : []

      const students = users.filter((u: any) => {
        const uInstId = typeof u.instituteId === 'object' ? u.instituteId?._id : u.instituteId
        return u.role === 'student' && uInstId === instituteId
      })
      const collectedFees = payments.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0)
      const pendingFees = students.length * 10000 - collectedFees // Simplified logic
      const upcomingExams = exams.filter((e: any) => new Date(e.date) > new Date()).length

      setStats({
        totalStudents: students.length,
        totalCourses: institute.courses?.length || 0,
        collectedFees,
        pendingFees: pendingFees > 0 ? pendingFees : 0,
        upcomingExams,
        activeBatches: 0,
        totalEnquiries: enquiries.length
      })

      setRecentStudents(students.slice(0, 5))
      setRecentEnquiries(enquiries.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`
    return `₹${amount.toLocaleString()}`
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-600" />
            Institute Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Overview of your institute's performance</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-background">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3" />
                  Active Enrollments
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Collected</p>
                <p className="text-3xl font-bold mt-2">{formatAmount(stats.collectedFees)}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  +12% from last month
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <IndianRupee className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Fees</p>
                <p className="text-3xl font-bold mt-2">{formatAmount(stats.pendingFees)}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  Needs Collection
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                <p className="text-3xl font-bold mt-2">{stats.totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-2">Running batches</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover:shadow-lg transition-all">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={revenueData} height={300} color="oklch(0.6 0.18 145)" />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                  <p className="text-3xl font-bold mt-2">{stats.upcomingExams}</p>
                  <p className="text-xs text-muted-foreground mt-2">Scheduled for next 30 days</p>
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
                  <p className="text-sm font-medium text-muted-foreground">New Enquiries</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalEnquiries}</p>
                  <p className="text-xs text-pink-600 flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3" />
                    Potential leads
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Phone className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Recent Enrollments
            </CardTitle>
            <Link href="/institute-admin/students" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {recentStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent enrollments</p>
              ) : (
                recentStudents.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background">{student.rollNo}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-600" />
              Recent Enquiries
            </CardTitle>
            <Link href="/institute-admin/enquiries" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {recentEnquiries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent enquiries</p>
              ) : (
                recentEnquiries.map((enq) => (
                  <div key={enq._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-l-orange-400">
                    <div>
                      <p className="font-medium text-sm">{enq.name}</p>
                      <p className="text-xs text-muted-foreground">{enq.courseInterested} • {enq.phone}</p>
                    </div>
                    <Badge variant={enq.status === 'New' ? 'default' : 'secondary'}>{enq.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
