'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/lms/widgets"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" - Removed
import { toast } from "sonner"
import { IndianRupee, Building2, BookOpen, Package, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const groupByInstitute = () => {
    const grouped: any = {}
    payments.forEach(p => {
      const instId = p.instituteId?._id
      if (!grouped[instId]) {
        grouped[instId] = {
          instituteId: instId,
          instituteName: p.instituteId?.name,
          status: p.instituteId?.status,
          students: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        }
      }
      grouped[instId].students.push(p)
      grouped[instId].totalAmount += p.totalAmount
      if (p.status === 'Paid') {
        grouped[instId].paidAmount += p.totalAmount
      } else {
        grouped[instId].pendingAmount += p.totalAmount
      }
    })
    return Object.values(grouped)
  }

  const pendingPayments = payments.filter(p => p.status === 'Pending')
  const paidPayments = payments.filter(p => p.status === 'Paid')
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0)

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>


  return (
    <div className="space-y-6">
      <SectionHeader title="Payment Gateway" subtitle="Track institute payments for courses and books" />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">₹{(totalPending / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">{pendingPayments.length} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">₹{(totalPaid / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">{paidPayments.length} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Enrolled</p>
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
                <p className="text-sm text-muted-foreground">Institutes</p>
                <p className="text-2xl font-bold">{groupByInstitute().length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center w-full pb-4">
          <AnimatedTabsProfessional
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "pending", label: "Pending Payments", count: pendingPayments.length },
              { id: "history", label: "Payment History", count: paidPayments.length },
            ]}
          />
        </div>

        {activeTab === "pending" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground self-end text-right px-1">
              Showing pending payments grouped by <span className="font-semibold text-foreground">{groupByInstitute().filter((g: any) => g.pendingAmount > 0).length} Institutes</span>
            </p>
            {groupByInstitute().filter((g: any) => g.pendingAmount > 0).map((group: any, i: number) => {
              const pendingStudents = group.students.filter((s: any) => s.status === 'Pending')
              const courseWise: any = {}
              pendingStudents.forEach((s: any) => {
                const cId = s.courseId?._id
                if (!courseWise[cId]) {
                  courseWise[cId] = {
                    name: s.courseId?.name,
                    total: 0,
                    withBooks: 0,
                    withoutBooks: 0,
                    amount: 0
                  }
                }
                courseWise[cId].total++
                if (s.bookPrice > 0) courseWise[cId].withBooks++
                else courseWise[cId].withoutBooks++
                courseWise[cId].amount += s.totalAmount
              })

              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                          <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-base">{group.instituteName}</CardTitle>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={group.status === 'Inactive' ? 'destructive' : 'default'} className="bg-green-600 hover:bg-green-700">
                            {group.status || 'Active'}
                          </Badge>
                          <Badge variant="destructive">Pending</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={group.status === 'Inactive' ? 'default' : 'destructive'}
                          className="h-7 text-xs"
                          onClick={async () => {
                            try {
                              const newStatus = group.status === 'Inactive' ? 'Active' : 'Inactive'
                              const res = await fetch(`/api/institutes/${group.instituteId}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus })
                              })
                              if (res.ok) {
                                toast.success(`Institute ${newStatus === 'Active' ? 'Activated' : 'Deactivated'}`)
                                fetchPayments()
                              } else {
                                toast.error('Failed to update status')
                              }
                            } catch (error) {
                              toast.error('Error updating status')
                            }
                          }}
                        >
                          {group.status === 'Inactive' ? 'Activate Account' : 'Deactivate Account'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-lg font-semibold">{pendingStudents.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                          <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">With Books</p>
                          <p className="text-lg font-semibold">{pendingStudents.filter((s: any) => s.bookPrice > 0).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Without Books</p>
                          <p className="text-lg font-semibold">{pendingStudents.filter((s: any) => s.bookPrice === 0).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                          <IndianRupee className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">To Collect</p>
                          <p className="text-lg font-semibold text-red-600">₹{group.pendingAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Course-wise Breakdown:</p>
                      <div className="space-y-2">
                        {Object.values(courseWise).map((course: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                            <div>
                              <p className="font-medium">{course.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.total} students • {course.withBooks} with books • {course.withoutBooks} without books
                              </p>
                            </div>
                            <p className="font-semibold text-red-600">₹{course.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground self-end text-right px-1">
              Showing payment history grouped by <span className="font-semibold text-foreground">{groupByInstitute().filter((g: any) => g.paidAmount > 0).length} Institutes</span>
            </p>
            {groupByInstitute().filter((g: any) => g.paidAmount > 0).map((group: any, i: number) => {
              const paidStudents = group.students.filter((s: any) => s.status === 'Paid')
              const courseWise: any = {}
              paidStudents.forEach((s: any) => {
                const cId = s.courseId?._id
                if (!courseWise[cId]) {
                  courseWise[cId] = {
                    name: s.courseId?.name,
                    total: 0,
                    withBooks: 0,
                    withoutBooks: 0,
                    amount: 0
                  }
                }
                courseWise[cId].total++
                if (s.bookPrice > 0) courseWise[cId].withBooks++
                else courseWise[cId].withoutBooks++
                courseWise[cId].amount += s.totalAmount
              })

              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-base">{group.instituteName}</CardTitle>
                      </div>
                      <Badge variant="default">Paid</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-lg font-semibold">{paidStudents.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                          <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">With Books</p>
                          <p className="text-lg font-semibold">{paidStudents.filter((s: any) => s.bookPrice > 0).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Without Books</p>
                          <p className="text-lg font-semibold">{paidStudents.filter((s: any) => s.bookPrice === 0).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                          <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Received</p>
                          <p className="text-lg font-semibold text-green-600">₹{group.paidAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Course-wise Breakdown:</p>
                      <div className="space-y-2">
                        {Object.values(courseWise).map((course: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                            <div>
                              <p className="font-medium">{course.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.total} students • {course.withBooks} with books • {course.withoutBooks} without books
                              </p>
                            </div>
                            <p className="font-semibold text-green-600">₹{course.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
