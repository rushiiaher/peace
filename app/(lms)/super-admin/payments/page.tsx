'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { StatCard } from "@/components/lms/widgets"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" - Removed
import { toast } from "sonner"
import { IndianRupee, Building2, BookOpen, Package, TrendingUp, CheckCircle, Clock, Eye, AlertCircle } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null)

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
    return Object.values(grouped).sort((a: any, b: any) => b.pendingAmount - a.pendingAmount)
  }

  const pendingPayments = payments.filter(p => p.status === 'Pending')
  const paidPayments = payments.filter(p => p.status === 'Paid')
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0)

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-8 p-6 pb-20">
      <SectionHeader title="Payment Gateway" subtitle="Track institute payments, royalties, and delivery charges" />

      {/* Stats Section with Gradients */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-white to-red-50/50 dark:from-gray-900 dark:to-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-inner">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Collection</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{(totalPending / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingPayments.length} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-inner">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Settled Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{(totalPaid / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground mt-1">{paidPayments.length} transactions</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{((totalPending + totalPaid) / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-inner">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Institutes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{groupByInstitute().length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Accounts</p>
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground self-end text-right px-1">
              Showing pending payments grouped by <span className="font-semibold text-foreground">{groupByInstitute().filter((g: any) => g.pendingAmount > 0).length} Institutes</span>
            </p>
            <div className="grid gap-6">
              {groupByInstitute().filter((g: any) => g.pendingAmount > 0).map((group: any, i: number) => {
                const pendingStudents = group.students.filter((s: any) => s.status === 'Pending')
                const courseWise: any = {}
                pendingStudents.forEach((s: any) => {
                  const cId = s.courseId?._id
                  if (!courseWise[cId]) {
                    courseWise[cId] = {
                      courseId: cId,
                      name: s.courseId?.name,
                      code: s.courseId?.code,
                      total: 0,
                      withBooks: 0,
                      withoutBooks: 0,
                      withDelivery: 0,
                      amount: 0,
                      // Unit Costs
                      examFee: s.examFee,
                      certCharge: s.certificateCharge,
                      bookPrice: s.bookPrice,
                      deliveryCharge: s.courseId?.deliveryCharge || 0,
                      isDeliveryPaid: payments.some((p: any) => p.status === 'Paid' && p.deliveryCharge > 0 && (p.courseId?._id || p.courseId) === cId)
                    }
                  }
                  courseWise[cId].total++
                  if (s.bookPrice > 0) courseWise[cId].withBooks++
                  else courseWise[cId].withoutBooks++
                  if (s.deliveryCharge > 0) courseWise[cId].withDelivery++
                  courseWise[cId].amount += s.totalAmount
                })

                return (
                  <Card key={i} className="group hover:shadow-lg transition-all border-muted/60 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50 border-b pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{group.instituteName}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={group.status === 'Inactive' ? 'destructive' : 'outline'} className="font-normal text-xs">
                                {group.status || 'Active'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{pendingStudents.length} Pending Transactions</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Pending</p>
                          <p className="text-2xl font-bold text-red-600">₹{group.pendingAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {Object.values(courseWise).map((course: any, idx: number) => (
                          <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{course.name} <span className="text-muted-foreground font-normal">({course.code})</span></p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {course.total} Students &bull; {course.withBooks} Books
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-bold">₹{course.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">Pending Amount</p>
                              </div>
                              <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                                setSelectedBreakdown(course)
                                setBreakdownOpen(true)
                              }}>
                                <Eye className="w-4 h-4" /> View Breakdown
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Similar Refinement for History Tab could be added here, but focusing on Pending as requested */}
        {activeTab === "history" && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium">Payment History View</p>
            <p className="text-xs text-muted-foreground">Historical data is available in reports.</p>
            {/* Keeping it simple for now as user focused on Pending Breakdown */}
          </div>
        )}
      </div>

      {/* Breakdown Dialog */}
      <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Royalty Breakdown
            </DialogTitle>
            <DialogDescription>
              Detailed fee structure for <span className="text-foreground font-medium">{selectedBreakdown?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            {selectedBreakdown && (() => {
              // Calculate Totals based on current batch count
              const totalExam = selectedBreakdown.examFee * selectedBreakdown.total
              const totalCert = selectedBreakdown.certCharge * selectedBreakdown.total
              const totalBooks = selectedBreakdown.bookPrice * selectedBreakdown.withBooks // Only for those with books
              // Delivery is tricky, it's summed in aggregation but let's approximate or use unit * count
              const totalDelivery = selectedBreakdown.deliveryCharge * selectedBreakdown.withDelivery

              const unitRoyalty = selectedBreakdown.examFee + selectedBreakdown.certCharge

              return (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Per Student Unit Cost */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" /> Unit Royalty (Per Student)
                      </h4>
                      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Exam Fee</span>
                          <span className="font-medium">₹{selectedBreakdown.examFee}</span>
                        </div>
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Certificate Charge</span>
                          <span className="font-medium">₹{selectedBreakdown.certCharge}</span>
                        </div>
                        <div className="p-3 bg-orange-50/50 dark:bg-orange-900/10 flex justify-between items-center">
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Total Fixed / Student</span>
                          <span className="font-bold text-lg text-orange-700 dark:text-orange-300">₹{unitRoyalty}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" /> Optional Per Student
                      </h4>
                      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Books & Material</span>
                          <span className="font-medium">₹{selectedBreakdown.bookPrice} <span className="text-xs text-muted-foreground">(If opted)</span></span>
                        </div>
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 flex justify-between items-center">
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Avg. Book Cost</span>
                          <span className="font-bold text-lg text-blue-700 dark:text-blue-300">₹{selectedBreakdown.bookPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Batch Totals */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" /> Batch Totals ({selectedBreakdown.total} Pending)
                      </h4>
                      <div className="rounded-xl border shadow-sm overflow-hidden divide-y">
                        <div className="p-3 flex justify-between bg-white dark:bg-card">
                          <div>
                            <p className="text-sm font-medium">Total Exam Fees</p>
                            <p className="text-xs text-muted-foreground">{selectedBreakdown.total} x ₹{selectedBreakdown.examFee}</p>
                          </div>
                          <span className="font-semibold">₹{totalExam.toLocaleString()}</span>
                        </div>
                        <div className="p-3 flex justify-between bg-white dark:bg-card">
                          <div>
                            <p className="text-sm font-medium">Total Cert. Charges</p>
                            <p className="text-xs text-muted-foreground">{selectedBreakdown.total} x ₹{selectedBreakdown.certCharge}</p>
                          </div>
                          <span className="font-semibold">₹{totalCert.toLocaleString()}</span>
                        </div>
                        <div className="p-3 flex justify-between bg-white dark:bg-card">
                          <div>
                            <p className="text-sm font-medium">Books Cost</p>
                            <p className="text-xs text-muted-foreground">{selectedBreakdown.withBooks} Students Included</p>
                          </div>
                          <span className="font-semibold">₹{totalBooks.toLocaleString()}</span>
                        </div>

                        <div className="p-3 flex justify-between bg-amber-50/50 dark:bg-amber-900/10">
                          <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Batch Delivery Charge</p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                              {selectedBreakdown.isDeliveryPaid ? 'Paid previously' : (selectedBreakdown.withDelivery > 0 ? 'Included below' : 'Pending - Will be added to first payment')}
                            </p>
                          </div>
                          <span className="font-semibold text-amber-700 dark:text-amber-300">
                            {selectedBreakdown.isDeliveryPaid ? 'Paid' : `₹${selectedBreakdown.deliveryCharge}`}
                          </span>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center border-t-2 border-dashed">
                          <div>
                            <span className="font-bold text-lg block">Total Pending</span>
                          </div>
                          <span className="font-bold text-xl text-primary">
                            ₹{(selectedBreakdown.amount + ((!selectedBreakdown.isDeliveryPaid && !(selectedBreakdown.withDelivery > 0)) ? (selectedBreakdown.deliveryCharge || 0) : 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Note: Delivery charge (₹{selectedBreakdown.deliveryCharge}) should be added only once per batch.
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter className="p-4 bg-gray-50/50 border-t">
            <Button onClick={() => setBreakdownOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
