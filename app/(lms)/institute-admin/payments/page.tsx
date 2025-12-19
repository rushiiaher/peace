'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { IndianRupee, Users, CheckCircle, Clock, CreditCard, ArrowRight, History, Receipt } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"
import { motion } from "framer-motion"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function InstitutePaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (!instituteId) return
    fetchPayments()
  }, [instituteId])

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments?instituteId=${instituteId}`)
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async (amount: number, paymentIds: string[], description: string) => {
    if (processing) return
    setProcessing(true)

    try {
      // 1. Create Order
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`
        })
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) throw new Error(orderData.error)

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LMS Fee Payment",
        description: description,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentIds: paymentIds
              })
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              toast.success('Payment successful!')
              fetchPayments()
            } else {
              toast.error('Payment verification failed')
            }
          } catch (error) {
            toast.error('Error verifying payment')
          }
        },
        prefill: {
          name: "Institute Admin",
          email: "admin@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3399cc"
        }
      }

      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay SDK failed to load. Please check your connection.')
        return
      }

      const rzp1 = new window.Razorpay(options)
      rzp1.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment Failed')
      })
      rzp1.open()

    } catch (error: any) {
      toast.error(error.message || 'Payment initiation failed')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayByCourse = (courseId: string) => {
    const coursePayments = pendingPayments.filter(p => p.courseId?._id === courseId)
    const total = coursePayments.reduce((sum, p) => sum + p.totalAmount, 0)
    const ids = coursePayments.map(p => p._id)

    handleRazorpayPayment(total, ids, `Fees for ${coursePayments.length} students`)
  }

  const handlePayAll = () => {
    if (pendingPayments.length === 0) return
    const ids = pendingPayments.map(p => p._id)
    handleRazorpayPayment(totalPending, ids, `Fees for all ${pendingPayments.length} students`)
  }

  const groupByCourse = () => {
    const grouped: any = {}
    pendingPayments.forEach(p => {
      const courseId = p.courseId?._id
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseName: p.courseId?.name,
          courseId: courseId,
          payments: [],
          total: 0
        }
      }
      grouped[courseId].payments.push(p)
      grouped[courseId].total += p.totalAmount
    })
    return Object.values(grouped)
  }

  const pendingPayments = payments.filter(p => p.status === 'Pending')
  const paidPayments = payments.filter(p => p.status === 'Paid')
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)

  const generateMissingPayments = async () => {
    try {
      const res = await fetch('/api/payments/generate', { method: 'POST' })
      const data = await res.json()
      toast.success(data.message || 'Payments generated')
      fetchPayments()
    } catch (error) {
      toast.error('Failed to generate payments')
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
    <div className="space-y-6">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader title="Payment Management" subtitle="Manage your platform fee payments securely." />
        {payments.length === 0 && !loading && (
          <Button onClick={generateMissingPayments} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" /> Load Enrolled Students
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <IndianRupee className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Pending Amount</p>
                <p className="text-3xl font-bold">₹{totalPending.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-orange-100/50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0">
                    Due Now
                  </Badge>
                  <p className="text-xs text-muted-foreground">{pendingPayments.length} students</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Enrolled</p>
                <p className="text-3xl font-bold">{payments.length}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    Active
                  </Badge>
                  <p className="text-xs text-muted-foreground">across all courses</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Paid This Month</p>
                <p className="text-3xl font-bold">₹{paidPayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                    Verified
                  </Badge>
                  <p className="text-xs text-muted-foreground">{paidPayments.length} txns</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6 flex justify-center">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "pending", label: "Pending Payments", count: pendingPayments.length },
            { id: "history", label: "Payment History", count: paidPayments.length > 0 ? paidPayments.length : undefined }
          ]}
        />
      </div>

      {activeTab === 'pending' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {pendingPayments.length > 0 && (
            <Card className="bg-gradient-to-r from-red-50 to-white dark:from-red-950/30 dark:to-background border-red-200 shadow-sm">
              <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                    <IndianRupee className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Action Required</p>
                    <p className="text-sm text-muted-foreground">
                      You have <span className="font-bold text-red-600">{pendingPayments.length} pending payments</span> totaling <span className="font-bold text-red-600">₹{totalPending.toLocaleString()}</span>.
                    </p>
                  </div>
                </div>
                <Button onClick={handlePayAll} size="lg" disabled={processing} className="w-full sm:w-auto shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white">
                  {processing ? 'Processing...' : 'Pay All Pending'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Course-wise Breakdown
              </CardTitle>
              <CardDescription>Consolidated pending fees grouped by course.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-lg">All Cleared!</p>
                  <p className="text-muted-foreground text-sm">You have no pending payments at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupByCourse().map((group: any) => (
                    <div key={group.courseId} className="border rounded-xl overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow">
                      <div className="bg-muted/30 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
                        <div>
                          <h3 className="font-bold text-base flex items-center gap-2">
                            {group.courseName}
                            <Badge variant="secondary" className="text-xs font-normal">
                              {group.payments.length} students
                            </Badge>
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">Platform charges for this course</p>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="text-right flex-1 sm:flex-none">
                            <p className="text-xs text-muted-foreground">Total Due</p>
                            <p className="text-lg font-bold text-red-600">₹{group.total.toLocaleString()}</p>
                          </div>
                          <Button onClick={() => handlePayByCourse(group.courseId)} size="sm" disabled={processing}>
                            Pay {group.payments.length}
                          </Button>
                        </div>
                      </div>
                      <div className="divide-y max-h-[300px] overflow-y-auto">
                        {group.payments.map((payment: any) => (
                          <div key={payment._id} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors text-sm">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {payment.studentId?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{payment.studentId?.name}</p>
                                <p className="text-[10px] text-muted-foreground">{payment.studentId?.rollNo}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{payment.totalAmount.toLocaleString()}</p>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                                {payment.bookPrice > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">Books</Badge>}
                                <span>Cert: ₹{payment.certificateCharge || 60}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paidPayments.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">No payment history found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const courseWise: any = {}
                    paidPayments.forEach((p: any) => {
                      const cId = p.courseId?._id
                      if (!courseWise[cId]) {
                        courseWise[cId] = {
                          name: p.courseId?.name,
                          payments: [],
                          total: 0,
                          withBooks: 0,
                          withoutBooks: 0
                        }
                      }
                      courseWise[cId].payments.push(p)
                      courseWise[cId].total += p.totalAmount
                      if (p.bookPrice > 0) courseWise[cId].withBooks++
                      else courseWise[cId].withoutBooks++
                    })

                    return Object.values(courseWise).map((course: any, idx: number) => (
                      <Card key={idx} className="overflow-hidden">
                        <div className="bg-muted/30 p-4 flex justify-between items-center border-b">
                          <div>
                            <h4 className="font-semibold text-sm">{course.name}</h4>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                              <span>{course.payments.length} students</span>
                              <span>•</span>
                              <span>{course.withBooks} books</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Paid</p>
                            <p className="text-lg font-bold text-green-600">₹{course.total.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y bg-card">
                          {course.payments.map((payment: any) => (
                            <div key={payment._id} className="p-3 flex justify-between items-center text-sm hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{payment.studentId?.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</span>
                                    {payment.razorpayPaymentId && (
                                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{payment.razorpayPaymentId}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">₹{payment.totalAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">Paid via Razorpay</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  )
}
