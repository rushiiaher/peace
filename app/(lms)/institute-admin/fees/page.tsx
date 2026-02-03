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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { IndianRupee, TrendingUp, Clock, Users, Calendar, Wallet, CreditCard, Banknote, CheckCircle2, History, AlertCircle, ArrowRight, Search, Filter, Download, FileText } from "lucide-react"
import { generateReceiptHtml, numberToWords } from "@/utils/generate-receipt"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import Loader from "@/components/ui/loader"

export default function FeesPage() {
  const [students, setStudents] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collectOpen, setCollectOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [institute, setInstitute] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [amountInput, setAmountInput] = useState('')

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterBatch, setFilterBatch] = useState('all')

  // History Tab Filters
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilterCourse, setHistoryFilterCourse] = useState('all')
  const [historyFilterBatch, setHistoryFilterBatch] = useState('all')
  const [historyFilterMode, setHistoryFilterMode] = useState('all')

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
      const [studentsRes, paymentsRes, instituteRes, batchesRes] = await Promise.all([
        fetch(`/api/users?instituteId=${instituteId}&role=student`),
        fetch(`/api/fee-payments?instituteId=${instituteId}`),
        fetch(`/api/institutes/${instituteId}`),
        fetch(`/api/batches?instituteId=${instituteId}`)
      ])

      const studentsData = await studentsRes.json()
      const paymentsData = await paymentsRes.json()
      const instituteData = await instituteRes.json()
      const batchesData = await batchesRes.json()

      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setPayments(paymentsData)
      setInstitute(instituteData)
      setCourses(instituteData.courses || [])
      setBatches(Array.isArray(batchesData) ? batchesData : [])
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
    const certCharge = course?.certificateCharge || 0
    const bookPrice = course?.bookPrice || 0
    const deliveryCharge = course?.deliveryCharge || 0 // Not collected from students

    const royalty = examFee + certCharge
    const suggestedPrice = baseFee + royalty
    const institutePrice = courseAssignment.institutePrice || suggestedPrice

    // Delivery charge is NOT included in student fees anymore
    // Institute admin will pay delivery charges separately per batch to super admin
    const finalAmount = courseEnrollment.booksIncluded
      ? institutePrice + bookPrice
      : institutePrice

    const studentPayments = payments.filter((p: any) =>
      p.studentId?._id === student._id &&
      (p.courseId?._id || p.courseId) === (courseEnrollment.courseId?._id || courseEnrollment.courseId)
    )
    const paidAmount = studentPayments.reduce((sum: number, p: any) => sum + p.paidAmount, 0)
    const dueAmount = finalAmount - paidAmount

    return { finalAmount, paidAmount, dueAmount, courseAssignment, course, payments: studentPayments, booksIncluded: courseEnrollment.booksIncluded, deliveryCharge }
  }

  const getStudentTotalDue = (student: any) => {
    return (student.courses || []).reduce((total: number, courseEnrollment: any) => {
      const details = getCourseFeeDetails(student, courseEnrollment)
      return total + (details?.dueAmount || 0)
    }, 0)
  }

  // Filter Logic
  const filteredStudents = students.filter((student: any) => {
    const hasDue = getStudentTotalDue(student) > 0
    if (!hasDue) return false

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        student.name?.toLowerCase().includes(query) ||
        student.rollNo?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Course Filter
    if (filterCourse !== 'all') {
      const hasCourse = student.courses?.some((c: any) =>
        (c.courseId?._id || c.courseId) === filterCourse
      )
      if (!hasCourse) return false
    }

    // Batch Filter
    if (filterBatch !== 'all') {
      const batch = batches.find(b => b._id === filterBatch)
      if (batch) {
        const isInBatch = batch.students?.some((sId: any) => sId === student._id || sId?._id === student._id)
        if (!isInBatch) return false
      }
    }

    return true
  })

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

  // Filtered History Logic
  const filteredHistory = payments.filter((p: any) => {
    const searchMatch = !historySearch ||
      p.studentId?.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.receiptNumber?.toLowerCase().includes(historySearch.toLowerCase())

    const courseMatch = historyFilterCourse === 'all' || (p.courseId?._id || p.courseId) === historyFilterCourse

    // Batch Filter Logic
    let batchMatch = true
    if (historyFilterBatch !== 'all') {
      const selectedBatch = batches.find(b => b._id === historyFilterBatch)
      if (selectedBatch) {
        // Check if the student who made the payment is in the selected batch
        batchMatch = selectedBatch.students?.some((sId: any) => sId === p.studentId?._id || sId?._id === p.studentId?._id)
      }
    }

    const modeMatch = historyFilterMode === 'all' || p.paymentMode === historyFilterMode

    return searchMatch && courseMatch && modeMatch && batchMatch
  })

  const downloadHistoryCSV = () => {
    const headers = ['Date', 'Receipt No', 'Student Name', 'Course', 'Payment Mode', 'Amount', 'Remarks']
    const rows = filteredHistory.map((p: any) => [
      new Date(p.paymentDate).toLocaleDateString(),
      p.receiptNumber,
      `"${p.studentId?.name || 'Unknown'}"`, // Quote for safety
      `"${p.courseId?.name || 'Unknown'}"`,
      p.paymentMode,
      p.paidAmount,
      `"${p.remarks || ''}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map((e: any[]) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `payment_history_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Receipt Logic
  const handlePrintReceipt = (payment: any = null, student: any = null, courseOverride: any = null) => {
    let targetStudent = student || payment?.studentId
    // Ensure we have an ID string or object with _id
    const studentId = targetStudent?._id || targetStudent
    const targetCourseId = courseOverride?.courseId?._id || courseOverride?.courseId || payment?.courseId?._id || payment?.courseId

    if (!studentId || !targetCourseId) {
      toast.error("Missing student or course information")
      return
    }

    const fullStudent = students.find(s => s._id === studentId) || targetStudent
    const courseAssignment = courses.find((c: any) => (c.courseId?._id || c.courseId) === targetCourseId)

    // Payments for this student & course
    const coursePayments = payments
      .filter(p => (p.studentId?._id || p.studentId) === studentId && (p.courseId?._id || p.courseId) === targetCourseId)
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())

    // Determine target payment for receipt (specific or latest)
    const currentPayment = payment || coursePayments[coursePayments.length - 1]

    if (!currentPayment) {
      toast.error("No payment records found to generate receipt")
      return
    }

    // Filter installments to only include those up to this payment (snapshot of time)
    const currentIndex = coursePayments.findIndex(p => p._id === currentPayment._id)
    const paymentsSoFar = currentIndex !== -1 ? coursePayments.slice(0, currentIndex + 1) : coursePayments

    const installments = paymentsSoFar.map((p, idx) => ({
      name: idx === 0 ? '1st Installment' : idx === 1 ? '2nd Installment' : `${idx + 1}th Installment`,
      amount: p.paidAmount,
      date: new Date(p.paymentDate).toLocaleDateString()
    }))

    const courseEnrollment = fullStudent?.courses?.find((c: any) => (c.courseId?._id || c.courseId) === targetCourseId)

    const data = {
      receiptNo: currentPayment.receiptNumber || `REC-${currentPayment._id?.substr(-6) || '0000'}`,
      date: new Date(currentPayment.paymentDate).toLocaleDateString(),
      studentName: fullStudent?.name || 'Student',
      amountInWords: numberToWords(currentPayment.paidAmount),
      totalAmount: currentPayment.paidAmount,
      paymentMode: currentPayment.paymentMode,
      paymentDate: new Date(currentPayment.paymentDate).toLocaleDateString(),
      bankName: currentPayment.paymentMode === 'Bank Transfer' ? 'Bank Transfer' : undefined,
      admissionMonth: new Date(courseEnrollment?.enrolledAt || fullStudent.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }),
      installments: installments,
      courseName: courseAssignment?.courseId?.name || 'Course',
      courseDuration: courseAssignment?.courseId?.duration || 'N/A',
      instituteName: institute?.name || "Tech Institute",
      instituteAddress: institute?.address || institute?.location,
      institutePhone: institute?.phone,
      instituteEmail: institute?.email
    }

    const html = generateReceiptHtml(data)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups to print receipt.")
    }
  }

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
            { id: "pending", label: "Pending Payments", count: filteredStudents.length },
            { id: "recent", label: "History", count: payments.length }
          ]}
        />
      </div>

      <div className="space-y-4">
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-muted/20 p-4 rounded-xl border">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student name or roll no..."
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c: any) => (
                      <SelectItem key={c.courseId?._id || c.courseId} value={c.courseId?._id || c.courseId}>
                        {c.courseId?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterBatch} onValueChange={setFilterBatch}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-background">
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((b: any) => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchQuery || filterCourse !== 'all' || filterBatch !== 'all') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterCourse('all')
                      setFilterBatch('all')
                    }}
                    title="Reset Filters"
                  >
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {/* Grouped Pending Tables */}
            {(() => {
              // Group Logic for Pending
              const groupedPending = filteredStudents.reduce((acc: any, student: any) => {
                student.courses.forEach((enrollment: any) => {
                  const fees = getCourseFeeDetails(student, enrollment)
                  if (!fees || fees.dueAmount <= 0) return

                  const courseId = enrollment.courseId?._id || enrollment.courseId
                  const batch = batches.find((b: any) => {
                    const batchCourseId = b.courseId?._id || b.courseId
                    // Check if batch matches course AND student is in batch
                    const inBatch = b.students?.some((s: any) => (s._id || s) === student._id)
                    return batchCourseId === courseId && inBatch
                  })

                  const batchName = batch ? batch.name : 'Unassigned Batch'
                  if (!acc[batchName]) acc[batchName] = []
                  acc[batchName].push({ student, enrollment, fees, batch })
                })
                return acc
              }, {})

              const batchGroups = Object.entries(groupedPending)

              if (batchGroups.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-dashed border-2 rounded-xl">
                    <div className="p-4 rounded-full bg-muted mb-4 opacity-50"><Filter className="w-8 h-8" /></div>
                    <h3 className="text-lg font-semibold">No Pending Fees Found</h3>
                    <p className="text-muted-foreground">All students are paid up or no matches found.</p>
                  </div>
                )
              }

              return (
                <div className="space-y-8">
                  {batchGroups.map(([batchName, items]: [string, any]) => (
                    <div key={batchName} className="space-y-3">
                      <div className="flex items-center gap-3 px-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{batchName}</h3>
                        <Badge variant="secondary" className="ml-2">{items.length} Records</Badge>
                      </div>

                      <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="w-[300px] pl-6">Student</TableHead>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Course</TableHead>
                              <TableHead>Total Fee</TableHead>
                              <TableHead>Paid</TableHead>
                              <TableHead>Due</TableHead>
                              <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(({ student, enrollment, fees }: any, idx: number) => (
                              <TableRow key={`${student._id}-${idx}`} className="group hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                      {student.documents?.photo ? (
                                        <img src={student.documents.photo} alt={student.name} className="w-full h-full object-cover" />
                                      ) : (
                                        (student.name || 'U').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm text-foreground">{student.name}</p>
                                      <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground">{student.rollNo || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">{fees.course?.name}</TableCell>
                                <TableCell className="font-medium text-sm">₹{fees.finalAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-green-600 text-sm">₹{fees.paidAmount.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">₹{fees.dueAmount.toLocaleString()}</Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2" onClick={() => {
                                      setSelectedStudent(student)
                                      setSelectedCourse(enrollment)
                                      setDetailsOpen(true)
                                    }}>
                                      <History className="w-3.5 h-3.5 mr-1.5" /> History
                                    </Button>
                                    <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 px-3" onClick={() => {
                                      setSelectedStudent(student)
                                      setSelectedCourse(enrollment)
                                      setAmountInput('')
                                      setCollectOpen(true)
                                    }}>
                                      Collect <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => handlePrintReceipt(null, student, enrollment)}
                                      disabled={fees.paidAmount <= 0}
                                      title="Print Latest Receipt"
                                    >
                                      <FileText className="w-3.5 h-3.5 mr-1" /> Receipt
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center">
                <div className="flex flex-wrap gap-4 items-center flex-1 w-full">
                  <div className="relative w-full sm:w-[250px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search Receipt or Student..."
                      className="pl-9"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </div>
                  <Select value={historyFilterCourse} onValueChange={(val) => {
                    setHistoryFilterCourse(val)
                    setHistoryFilterBatch('all')
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((c: any) => (
                        <SelectItem key={c.courseId?._id || c.courseId} value={c.courseId?._id || c.courseId}>
                          {c.courseId?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={historyFilterBatch} onValueChange={setHistoryFilterBatch}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches
                        .filter(b => historyFilterCourse === 'all' || (b.courseId?._id || b.courseId) === historyFilterCourse)
                        .map((b: any) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select value={historyFilterMode} onValueChange={setHistoryFilterMode}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  {(historySearch || historyFilterCourse !== 'all' || historyFilterBatch !== 'all' || historyFilterMode !== 'all') && (
                    <Button variant="ghost" onClick={() => {
                      setHistorySearch('')
                      setHistoryFilterCourse('all')
                      setHistoryFilterBatch('all')
                      setHistoryFilterMode('all')
                    }}>
                      Clear
                    </Button>
                  )}
                </div>
                <Button variant="outline" className="gap-2" onClick={downloadHistoryCSV} disabled={filteredHistory.length === 0}>
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </CardContent>
            </Card>

            {(() => {
              // Group History by Batch
              const groupedHistory = filteredHistory.reduce((acc: any, payment: any) => {
                const courseId = payment.courseId?._id || payment.courseId
                const studentId = payment.studentId?._id || payment.studentId
                const batch = batches.find((b: any) => {
                  const batchCourseId = b.courseId?._id || b.courseId
                  const inBatch = b.students?.some((s: any) => (s._id || s) === studentId)
                  return batchCourseId === courseId && inBatch
                })

                const batchName = batch ? batch.name : 'Unassigned Batch'
                if (!acc[batchName]) acc[batchName] = []
                acc[batchName].push({ payment, batch })
                return acc
              }, {})

              const historyGroups = Object.entries(groupedHistory)

              if (historyGroups.length === 0) {
                return <div className="text-center py-10 text-muted-foreground">No payments found.</div>
              }

              return (
                <div className="space-y-8">
                  {historyGroups.map(([batchName, items]: [string, any]) => (
                    <div key={batchName} className="space-y-3">
                      <div className="flex items-center gap-3 px-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{batchName}</h3>
                        <Badge variant="secondary" className="ml-2">{items.length} Records</Badge>
                      </div>

                      <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="pl-6">Date</TableHead>
                              <TableHead>Receipt #</TableHead>
                              <TableHead className="w-[300px]">Student</TableHead>
                              <TableHead>Course</TableHead>
                              <TableHead>Mode</TableHead>
                              <TableHead className="text-right pr-6">Amount</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(({ payment }: { payment: any }, idx: number) => (
                              <TableRow key={idx} className="group hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 font-medium">
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                  <div className="text-xs text-muted-foreground">{new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="font-mono">{payment.receiptNumber}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                      {payment.studentId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <div className="font-medium">{payment.studentId?.name}</div>
                                      <div className="text-xs text-muted-foreground">{payment.studentId?.rollNo}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{payment.courseId?.name}</TableCell>
                                <TableCell><Badge variant="secondary">{payment.paymentMode}</Badge></TableCell>
                                <TableCell className="text-right font-bold text-green-600 pr-6">₹{payment.paidAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handlePrintReceipt(payment)}>
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
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
                  <form onSubmit={handleCollectFee} className="space-y-6 h-full flex flex-col pt-6 px-2">
                    <div className="space-y-6">

                      {/* Amount Section */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex justify-between items-center">
                          Payment Amount
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() => setAmountInput(feeDetails.dueAmount.toString())}
                            title="Click to set full amount"
                          >
                            Max: ₹{feeDetails.dueAmount.toLocaleString()}
                          </Badge>
                        </Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-primary">
                            <span className="text-xl font-bold text-muted-foreground group-focus-within:text-primary">₹</span>
                          </div>
                          <Input
                            name="amount"
                            type="number"
                            className="pl-10 h-14 text-2xl font-bold tracking-tight bg-muted/30 border-2 focus-visible:ring-0 focus-visible:border-primary transition-all"
                            placeholder="0"
                            required
                            value={amountInput}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                setAmountInput('')
                                return
                              }

                              const numVal = Number(value)

                              if (numVal > feeDetails.dueAmount) {
                                setAmountInput(feeDetails.dueAmount.toString())
                                toast.warning(`Amount limited to outstanding due: ₹${feeDetails.dueAmount.toLocaleString()}`)
                              } else if (numVal < 0) {
                                setAmountInput('0')
                              } else {
                                setAmountInput(value)
                              }
                            }}
                            max={feeDetails.dueAmount}
                            min="1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground pl-1">
                          Enter the amount to be collected. Click 'Max' to fill balance.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Payment Mode</Label>
                          <Select name="paymentMode" required defaultValue="Cash">
                            <SelectTrigger className="h-11 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Card">Credit/Debit Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Remarks / Reference No.</Label>
                          <Input name="remarks" placeholder="Optional notes (e.g. Transaction ID)" className="h-11 bg-background" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t">
                      <Button type="submit" className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-md transition-all active:scale-[0.98]">
                        Process Payment
                        <CheckCircle2 className="w-5 h-5 ml-2" />
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" /> Receipt will be generated automatically.
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
                      <div className="flex justify-between"><span>Institute Fee:</span> <span>₹{(feeDetails.courseAssignment?.institutePrice ? feeDetails.courseAssignment.institutePrice - (feeDetails.course?.examFee + feeDetails.course?.certificateCharge) : feeDetails.course?.baseFee)?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Exam Fee:</span> <span>₹{feeDetails.course?.examFee?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Certificate Charge:</span> <span>₹{feeDetails.course?.certificateCharge?.toLocaleString()}</span></div>
                      <div className="col-span-2 border-t border-blue-200 dark:border-blue-800 my-1"></div>
                      {feeDetails.booksIncluded && (
                        <div className="flex justify-between"><span>Books:</span> <span>₹{feeDetails.course?.bookPrice?.toLocaleString()}</span></div>
                      )}
                      <div className="flex justify-between font-medium text-foreground"><span>Total:</span> <span>₹{feeDetails.finalAmount.toLocaleString()}</span></div>
                    </div>
                    {feeDetails.booksIncluded && feeDetails.deliveryCharge > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        Note: Delivery charges (₹{feeDetails.deliveryCharge.toLocaleString()}) are paid separately by institute per batch.
                      </p>
                    )}
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
