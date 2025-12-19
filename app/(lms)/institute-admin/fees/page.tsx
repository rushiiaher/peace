'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { toast } from "sonner"
import { IndianRupee, TrendingUp, Clock, Users, Calendar, Wallet, CreditCard, Banknote, CheckCircle2, History, AlertCircle, ArrowRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import Loader from "@/components/ui/loader"

export default function FeesPage() {
  const [students, setStudents] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collectOpen, setCollectOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchData()
    }
  }, [instituteId])

  const fetchData = async () => {
    try {
      const [studentsRes, paymentsRes, instituteRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/fee-payments?instituteId=${instituteId}`),
        fetch(`/api/institutes/${instituteId}`)
      ])

      const studentsData = await studentsRes.json()
      const paymentsData = await paymentsRes.json()
      const instituteData = await instituteRes.json()

      setStudents(studentsData.filter((u: any) => u.role === 'student' && u.instituteId === instituteId))
      setPayments(paymentsData)
      setCourses(instituteData.courses || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const getCourseFeeDetails = (student: any, courseEnrollment: any) => {
    const courseAssignment = courses.find((c: any) => c.courseId?._id === (courseEnrollment.courseId?._id || courseEnrollment.courseId))
    if (!courseAssignment) return null

    const course = courseAssignment.courseId
    const baseFee = course?.baseFee || 0
    const examFee = course?.examFee || 0
    const bookPrice = course?.bookPrice || 0
    const deliveryCharge = course?.deliveryCharge || 0

    const basePrice = baseFee + examFee
    const institutePrice = courseAssignment.institutePrice || basePrice

    const finalAmount = courseEnrollment.booksIncluded
      ? institutePrice + bookPrice + deliveryCharge
      : institutePrice

    const studentPayments = payments.filter((p: any) =>
      p.studentId?._id === student._id &&
      (p.courseId?._id || p.courseId) === (courseEnrollment.courseId?._id || courseEnrollment.courseId)
    )
    const paidAmount = studentPayments.reduce((sum: number, p: any) => sum + p.paidAmount, 0)
    const dueAmount = finalAmount - paidAmount

    return { finalAmount, paidAmount, dueAmount, courseAssignment, course, payments: studentPayments, booksIncluded: courseEnrollment.booksIncluded }
  }

  const getStudentTotalDue = (student: any) => {
    return (student.courses || []).reduce((total: number, courseEnrollment: any) => {
      const details = getCourseFeeDetails(student, courseEnrollment)
      return total + (details?.dueAmount || 0)
    }, 0)
  }

  const handleCollectFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get('amount'))

    const feeDetails = getCourseFeeDetails(selectedStudent, selectedCourse)
    if (!feeDetails) return

    const data = {
      studentId: selectedStudent._id,
      instituteId,
      courseId: selectedCourse.courseId?._id || selectedCourse.courseId,
      totalAmount: feeDetails.finalAmount,
      paidAmount: amount,
      dueAmount: feeDetails.dueAmount - amount,
      paymentMode: formData.get('paymentMode'),
      remarks: formData.get('remarks')
    }

    try {
      const res = await fetch('/api/fee-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Payment collected successfully')
        setCollectOpen(false)
        fetchData()
        e.currentTarget.reset()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to collect payment')
      }
    } catch (error) {
      toast.error('Failed to collect payment')
    }
  }

  const todayCollection = payments
    .filter((p: any) => new Date(p.paymentDate).toDateString() === new Date().toDateString())
    .reduce((sum: number, p: any) => sum + p.paidAmount, 0)

  const thisMonthCollection = payments
    .filter((p: any) => {
      const date = new Date(p.paymentDate)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    .reduce((sum: number, p: any) => sum + p.paidAmount, 0)

  const totalOutstanding = students.reduce((sum: number, s: any) => sum + getStudentTotalDue(s), 0)

  const overdueStudents = students.filter((s: any) => getStudentTotalDue(s) > 0)

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 pb-20">
      <SectionHeader title="Fee Collection" subtitle="Collect and manage student fees" />

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-inner">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Collection</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{todayCollection.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-inner">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{thisMonthCollection.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-orange-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-inner">
                <IndianRupee className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-white to-red-50/50 dark:from-gray-900 dark:to-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-inner">
                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overdueStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-2">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "pending", label: "Pending Payments", count: students.filter((s: any) => getStudentTotalDue(s) > 0).length },
            { id: "recent", label: "Recent Collections", count: payments.length }
          ]}
        />
      </div>

      <div className="space-y-4">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {students.filter((s: any) => getStudentTotalDue(s) > 0).map((student: any) => {
              const totalDue = getStudentTotalDue(student)
              const studentCourses = student.courses || []

              return (
                <Card key={student._id} className="overflow-hidden border-muted/60 hover:shadow-lg transition-all group">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${totalDue > 10000 ? 'from-red-500 to-orange-500' : 'from-yellow-400 to-yellow-600'}`} />
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
                      {/* Student Info */}
                      <div className="p-5 flex-1 min-h-[140px] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{student.name}</h3>
                            <Badge variant={student.status === 'Inactive' ? 'destructive' : 'default'} className="rounded-md">
                              {student.status || 'Active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> {student.rollNo}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Wallet className="w-3.5 h-3.5" /> Total Due: <span className="text-red-600 font-semibold">₹{totalDue.toLocaleString()}</span>
                          </p>
                        </div>

                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto text-xs h-8"
                            onClick={async () => {
                              // Status toggle logic simplified for this view
                              try {
                                const newStatus = student.status === 'Inactive' ? 'Active' : 'Inactive'
                                const res = await fetch(`/api/users/${student._id}/status`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus })
                                })
                                if (res.ok) {
                                  toast.success(`Student ${newStatus === 'Active' ? 'Activated' : 'Deactivated'}`)
                                  fetchData()
                                }
                              } catch (error) { toast.error('Error') }
                            }}
                          >
                            {student.status === 'Inactive' ? 'Activate Student' : 'Deactivate Student'}
                          </Button>
                        </div>
                      </div>

                      {/* Course Payments */}
                      <div className="p-5 flex-[2] bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Enrolled Courses & Fees</p>
                        {studentCourses.map((courseEnrollment: any, idx: number) => {
                          const feeDetails = getCourseFeeDetails(student, courseEnrollment)
                          if (!feeDetails || feeDetails.dueAmount === 0) return null
                          const progress = Math.min(100, (feeDetails.paidAmount / feeDetails.finalAmount) * 100)

                          return (
                            <div key={idx} className="bg-background rounded-lg p-3 border shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <p className="font-medium text-sm">{feeDetails.course?.name}</p>
                                <Badge variant="outline" className="text-xs font-normal border-red-200 text-red-600 bg-red-50">
                                  Due: ₹{feeDetails.dueAmount.toLocaleString()}
                                </Badge>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Paid: ₹{feeDetails.paidAmount.toLocaleString()}</span>
                                  <span>Total: ₹{feeDetails.finalAmount.toLocaleString()}</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-dashed">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                  setSelectedStudent(student)
                                  setSelectedCourse(courseEnrollment)
                                  setDetailsOpen(true)
                                }}>
                                  <History className="w-3 h-3 mr-1" /> History
                                </Button>
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => {
                                  setSelectedStudent(student)
                                  setSelectedCourse(courseEnrollment)
                                  setCollectOpen(true)
                                }}>
                                  Collect Fee <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {students.filter((s: any) => getStudentTotalDue(s) > 0).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground">No students have pending payments.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {payments.slice(0, 30).map((payment: any) => (
              <Card key={payment._id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Banknote className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-bold text-lg">₹{payment.paidAmount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">{payment.studentId?.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{payment.courseId?.name}</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                      <span>{payment.paymentMode}</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-xs font-mono text-center">
                      RCT: #{payment.receiptNumber}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {payments.length === 0 && (
              <p className="col-span-full text-center py-10 text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="grid md:grid-cols-5 h-auto md:min-h-[500px]">
            {/* Left Panel: Summary */}
            <div className="md:col-span-2 bg-muted/40 p-6 border-r flex flex-col justify-between">
              <div>
                <DialogHeader className="mb-6">
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> Collection
                  </DialogTitle>
                  <DialogDescription>Transaction Summary</DialogDescription>
                </DialogHeader>

                {selectedStudent && selectedCourse && (() => {
                  const feeDetails = getCourseFeeDetails(selectedStudent, selectedCourse)
                  if (!feeDetails) return null
                  return (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs uppercase text-muted-foreground font-semibold">Student</p>
                        <p className="font-medium text-lg">{selectedStudent.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.rollNo}</p>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs uppercase text-muted-foreground font-semibold">Course</p>
                        <p className="font-medium">{feeDetails.course?.name}</p>
                        <div className="flex gap-2 text-xs mt-2">
                          <Badge variant="outline" className="font-normal">Total: ₹{feeDetails.finalAmount.toLocaleString()}</Badge>
                          <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">Paid: ₹{feeDetails.paidAmount.toLocaleString()}</Badge>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-black border rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-center text-muted-foreground mb-1">Current Balance Due</p>
                        <p className="text-3xl font-bold text-center text-red-600">₹{feeDetails.dueAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="text-xs text-muted-foreground pt-6 text-center">
                Secure Transaction • Linked to Accounting
              </div>
            </div>

            {/* Right Panel: Form */}
            <div className="md:col-span-3 p-6 bg-background">
              {selectedStudent && selectedCourse && (() => {
                const feeDetails = getCourseFeeDetails(selectedStudent, selectedCourse)
                if (!feeDetails) return null

                return (
                  <form onSubmit={handleCollectFee} className="space-y-6 h-full flex flex-col justify-center">
                    <div className="space-y-4">
                      <Label className="text-base">Payment Amount</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          name="amount"
                          type="number"
                          className="pl-10 h-12 text-lg"
                          placeholder="Enter amount"
                          required
                          max={feeDetails.dueAmount}
                          min="1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Payment Mode</Label>
                          <Select name="paymentMode" required defaultValue="Cash">
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Card">Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Remarks</Label>
                          <Input name="remarks" placeholder="Optional notes" className="h-10" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto">
                      <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20">
                        Process Payment
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-3">
                        Receipt will be generated automatically.
                      </p>
                    </div>
                  </form>
                )
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              Detailed statement for {selectedStudent?.name} - {selectedCourse?.courseId?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedStudent && selectedCourse && (() => {
              const feeDetails = getCourseFeeDetails(selectedStudent, selectedCourse)
              if (!feeDetails) return null

              return (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase">Total Fees</p>
                      <p className="font-semibold text-lg">₹{feeDetails.finalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-xs text-muted-foreground uppercase">Total Paid</p>
                      <p className="font-semibold text-lg text-green-600">₹{feeDetails.paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase">Balance Due</p>
                      <p className="font-semibold text-lg text-red-600">₹{feeDetails.dueAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <History className="w-4 h-4" /> Transaction Log
                    </h4>
                    {feeDetails.payments.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">No transactions found</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-muted pl-6 space-y-6 ml-2 my-4">
                        {feeDetails.payments.map((payment: any) => (
                          <div key={payment._id} className="relative">
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-green-600">+₹{payment.paidAmount.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(payment.paymentDate).toLocaleString()}</p>
                                </div>
                                <Badge variant="outline">#{payment.receiptNumber}</Badge>
                              </div>
                              <div className="flex gap-4 text-xs">
                                <span className="bg-muted px-2 py-1 rounded">Via: {payment.paymentMode}</span>
                                {payment.remarks && <span className="text-muted-foreground">Note: {payment.remarks}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-blue-800 dark:text-blue-300">Fee Breakdown:</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-muted-foreground">
                      <div className="flex justify-between"><span>Base Fee:</span> <span>₹{feeDetails.course?.baseFee?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Exam Fee:</span> <span>₹{feeDetails.course?.examFee?.toLocaleString()}</span></div>
                      <div className="col-span-2 border-t border-blue-200 dark:border-blue-800 my-1"></div>
                      {feeDetails.booksIncluded && (
                        <>
                          <div className="flex justify-between"><span>Books:</span> <span>₹{feeDetails.course?.bookPrice?.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Delivery:</span> <span>₹{feeDetails.course?.deliveryCharge?.toLocaleString()}</span></div>
                        </>
                      )}
                      <div className="flex justify-between font-medium text-foreground"><span>Total:</span> <span>₹{feeDetails.finalAmount.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
