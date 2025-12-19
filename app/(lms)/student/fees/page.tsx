'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Wallet, IndianRupee, BookOpen, Calendar, CreditCard, Receipt } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function FeesPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [institute, setInstitute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (!studentId || !instituteId) return
    fetchData()
  }, [studentId, instituteId])

  const fetchData = async () => {
    try {
      const [paymentsRes, userRes, instituteRes] = await Promise.all([
        fetch(`/api/fee-payments?studentId=${studentId}`),
        fetch('/api/users'),
        fetch(`/api/institutes/${instituteId}`)
      ])

      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : []
      const usersData = userRes.ok ? await userRes.json() : []
      const instituteData = instituteRes.ok ? await instituteRes.json() : null

      const student = usersData.find((u: any) => u._id === studentId)

      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      setCourses(student?.courses || [])
      setInstitute(instituteData)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to fetch fee details')
    } finally {
      setLoading(false)
    }
  }

  const getCoursePayments = (courseId: string) => {
    return payments.filter(p => (p.courseId?._id || p.courseId) === courseId)
  }

  const getCourseTotals = (courseEnrollment: any) => {
    const courseId = courseEnrollment.courseId?._id || courseEnrollment.courseId
    const coursePayments = getCoursePayments(courseId)

    if (!institute) {
      return { totalAmount: 0, paidAmount: 0, dueAmount: 0, booksIncluded: courseEnrollment.booksIncluded }
    }

    const courseAssignment = institute.courses?.find((c: any) =>
      (c.courseId?._id || c.courseId?.toString()) === courseId?.toString()
    )

    if (!courseAssignment) {
      return { totalAmount: 0, paidAmount: 0, dueAmount: 0, booksIncluded: courseEnrollment.booksIncluded }
    }

    const course = courseAssignment.courseId
    const baseFee = course?.baseFee || 0
    const examFee = course?.examFee || 0
    const bookPrice = course?.bookPrice || 0
    const deliveryCharge = course?.deliveryCharge || 0

    const basePrice = baseFee + examFee
    const institutePrice = courseAssignment.institutePrice || basePrice

    const totalAmount = courseEnrollment.booksIncluded
      ? institutePrice + bookPrice + deliveryCharge
      : institutePrice

    const paidAmount = coursePayments.reduce((sum, p) => sum + p.paidAmount, 0)
    const dueAmount = totalAmount - paidAmount
    return { totalAmount, paidAmount, dueAmount, booksIncluded: courseEnrollment.booksIncluded }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0)
  const totalDue = courses.reduce((sum, c) => {
    const totals = getCourseTotals(c)
    return sum + totals.dueAmount
  }, 0)
  const totalAmount = courses.reduce((sum, c) => {
    const totals = getCourseTotals(c)
    return sum + totals.totalAmount
  }, 0)

  if (loading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Fee Details" subtitle="Manages all your fee-related information and transactions." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fee</p>
                <p className="text-3xl font-bold mt-2">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <IndianRupee className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                <p className="text-3xl font-bold mt-2">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold mt-2">₹{totalDue.toLocaleString()}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <IndianRupee className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Fee Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {courses.map((course) => {
                const totals = getCourseTotals(course)
                return (
                  <div key={course.courseId?._id || course.courseId}>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-muted-foreground">{course.courseId?.name}</span>
                        {totals.booksIncluded && <span className="text-xs ml-2">(with books)</span>}
                      </div>
                      <span className="font-semibold">₹{totals.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Paid: ₹{totals.paidAmount.toLocaleString()}</span>
                      <span className="text-red-600">Due: ₹{totals.dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t pt-3 mt-3"></div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fee</span>
                <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Amount</span>
                <span className="font-semibold text-destructive">₹{totalDue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Payment Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-lg font-semibold">{courses.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Courses Paid</p>
              <p className="text-lg font-semibold">{courses.filter(c => getCourseTotals(c).dueAmount === 0).length} / {courses.length}</p>
            </div>
            {totalDue > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <p className="font-medium">Pending: ₹{totalDue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Contact institute to complete payment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Payment History</CardTitle>
            </div>
            <Badge variant="outline">{payments.length} Payments</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment history</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment: any) => (
                <div key={payment._id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                        <IndianRupee className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-base">₹{payment.paidAmount.toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(payment.paymentDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {payment.paymentMode}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium text-blue-600">{payment.courseId?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">#{payment.receiptNumber}</Badge>
                    </div>
                  </div>
                  {payment.remarks && (
                    <p className="text-xs text-muted-foreground mt-1">Note: {payment.remarks}</p>
                  )}
                  <div className="border-t mt-3"></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
