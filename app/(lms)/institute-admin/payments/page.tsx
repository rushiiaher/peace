'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { IndianRupee, Users, CheckCircle, Clock, ArrowRight, History, Search, Filter } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [batches, setBatches] = useState<any[]>([])
  const [instituteName, setInstituteName] = useState('')

  // New Filters
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterBatch, setFilterBatch] = useState('all')
  const [showPastBatches, setShowPastBatches] = useState(false) // Toggle: if true, show finished batches too (or only)

  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())

  // --- Derived State & Filter Logic ---
  const getBatchStatus = (payment: any) => {
    // Find matching batch
    const batch = batches.find((b: any) =>
      b.courseId?._id === payment.courseId?._id &&
      b.students?.some((s: any) => s._id === payment.studentId?._id || s === payment.studentId?._id)
    )
    if (!batch) return 'Active' // Default if not found (should be rare)

    // Check if batch is effectively finished based on End Date
    // Normalize to start of day for proper comparison
    const endDate = new Date(batch.endDate)
    const today = new Date()
    endDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (endDate < today) return 'Finished'
    return 'Active'
  }

  const getFilteredPayments = (list: any[], ignoreBatchStatus = false) => {
    return list.filter(p => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = p.studentId?.name?.toLowerCase().includes(q)
        const matchesRoll = p.studentId?.rollNo?.toLowerCase().includes(q)
        if (!matchesName && !matchesRoll) return false
      }

      // 2. Course Filter
      if (filterCourse !== 'all') {
        if (p.courseId?._id !== filterCourse) return false
      }

      // 3. Batch Filter (Specific Batch) - Check this FIRST or override status
      const batch = batches.find((b: any) =>
        b.courseId?._id === p.courseId?._id &&
        b.students?.some((s: any) => s._id === p.studentId?._id || s === p.studentId?._id)
      )

      if (filterBatch !== 'all') {
        if (batch?._id !== filterBatch) return false
        // If specific batch matched, we keep it. We do NOT check "Active/Finished" status
        // because the user explicitly asked for this batch.
      } else {
        // 4. Status Filter (Global Toggle)
        // Only apply if we are NOT ignoring it (History tab) AND no specific batch selected
        if (!ignoreBatchStatus) {
          const status = getBatchStatus(p)
          if (!showPastBatches && status !== 'Active') return false
        }
      }

      return true
    })
  }

  // Base Lists
  const allPending = payments.filter((p: any) => p.status === 'Pending')
  const allPaid = payments.filter((p: any) => p.status === 'Paid')

  // Filtered Lists
  const pendingPayments = getFilteredPayments(allPending, false)
  const filteredPaidPayments = getFilteredPayments(allPaid, false)

  const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + p.totalAmount, 0)

  // Derive available batches for filter based on selected course
  const availableBatches = filterCourse === 'all'
    ? batches
    : batches.filter(b => b.courseId?._id === filterCourse || b.courseId === filterCourse)


  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (!instituteId) return
    fetchData()
  }, [instituteId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Prevent caching with timestamp and headers
      const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      const ts = Date.now()

      const [payRes, batchRes, instRes] = await Promise.all([
        fetch(`/api/payments?instituteId=${instituteId}&t=${ts}`, { headers }),
        fetch(`/api/batches?instituteId=${instituteId}&t=${ts}`, { headers }),
        fetch(`/api/institutes/${instituteId}?t=${ts}`, { headers })
      ])

      const payData = await payRes.json()
      const batchData = await batchRes.json()
      const instData = await instRes.json()

      setPayments(Array.isArray(payData) ? payData : [])
      setBatches(Array.isArray(batchData) ? batchData : [])
      setCourses(instData.courses || [])
      setInstituteName(instData.name || '')
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async (amount: number, paymentIds: string[], description: string) => {
    if (processing) return
    setProcessing(true)

    try {
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

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LMS Fee Payment",
        description: description,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
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
              toast.success('Payment successful! Refreshing...')
              // Force reload to ensure fresh data, but delay to let UI cleanup
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            } else {
              toast.error('Payment verification failed')
            }
          } catch (error) {
            toast.error('Error verifying payment')
          }
        },
        prefill: {
          name: instituteName || "Institute Admin",
          email: JSON.parse(localStorage.getItem('user') || '{}').email || "admin@example.com",
          contact: "9999999999"
        },
        theme: { color: "#3399cc" }
      }

      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay SDK failed to load.')
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

  const handlePayAll = () => {
    if (pendingPayments.length === 0) return
    const ids = pendingPayments.map(p => p._id)
    handleRazorpayPayment(totalPending, ids, `Fees for all ${pendingPayments.length} students`)
  }

  const handlePaySelection = async (batchId: string) => {
    const batchGroup = groupPendingByBatch().find((g: any) => g.batchId === batchId) as any
    if (!batchGroup) return

    const selectedIds = batchGroup.payments
      .filter((p: any) => selectedPayments.has(p._id))
      .map((p: any) => p._id)

    if (selectedIds.length === 0) {
      toast.error('Select at least one student')
      return
    }

    // Delivery Charge Logic
    const matchedCourse = courses.find((c: any) => (c.courseId?._id || c.courseId) === batchGroup.courseId)
    const batchDeliveryCharge = matchedCourse?.courseId?.deliveryCharge || matchedCourse?.deliveryCharge || 0
    const isDeliveryPaid = allPaid.some((p: any) => (p.courseId?._id || p.courseId) === batchGroup.courseId && p.deliveryCharge > 0)

    let totalAmount = 0
    batchGroup.payments.forEach((p: any) => {
      if (selectedPayments.has(p._id)) totalAmount += p.totalAmount
    })

    if (!isDeliveryPaid && batchDeliveryCharge > 0) {
      // Add delivery charge to the first selected payment
      // We update the backend record so valid invoice is generated upon success
      const targetPaymentId = selectedIds[0]

      setProcessing(true)
      try {
        const res = await fetch('/api/payments/add-delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: targetPaymentId, deliveryCharge: batchDeliveryCharge })
        })

        if (!res.ok) throw new Error('Failed to apply delivery charge')

        // Add to total for Razorpay processing
        totalAmount += batchDeliveryCharge
      } catch (error) {
        toast.error('Failed to apply delivery charge. Please try again.')
        setProcessing(false)
        return
      }
    }

    handleRazorpayPayment(totalAmount, selectedIds, `Fees for ${selectedIds.length} students`)
  }

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedPayments)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedPayments(newSet)
  }

  const toggleBatchSelection = (batchId: string, select: boolean) => {
    const batchGroup = groupPendingByBatch().find((g: any) => g.batchId === batchId) as any
    if (!batchGroup) return
    const newSet = new Set(selectedPayments)
    batchGroup.payments.forEach((p: any) => {
      if (select) newSet.add(p._id)
      else newSet.delete(p._id)
    })
    setSelectedPayments(newSet)
  }

  const groupPendingByBatch = () => {
    const grouped: any = {}
    pendingPayments.forEach(p => {
      // Find Batch
      let batchName = 'Unassigned Batch'
      let batchId = 'unassigned'
      const courseId = p.courseId?._id || p.courseId
      const courseName = p.courseId?.name || 'Unknown Course'

      const batch = batches.find(b => (b.courseId?._id || b.courseId) === courseId && b.students?.some((s: any) => (s._id || s) === p.studentId?._id))
      if (batch) {
        batchName = batch.name
        batchId = batch._id
      }

      if (!grouped[batchId]) {
        grouped[batchId] = {
          batchId: batchId,
          batchName: batchName,
          courseName: courseName,
          courseId: courseId,
          payments: [],
          total: 0
        }
      }
      grouped[batchId].payments.push(p)
      grouped[batchId].total += p.totalAmount
    })
    return Object.values(grouped).sort((a: any, b: any) => a.batchName.localeCompare(b.batchName))
  }

  const groupPaidByBatch = () => {
    const grouped: any = {}
    filteredPaidPayments.forEach(p => {
      // Find Batch
      let batchName = 'Unassigned Batch'
      let batchId = 'unassigned'
      let status = 'Active'
      const courseId = p.courseId?._id || p.courseId
      const courseName = p.courseId?.name || 'Unknown Course'

      const batch = batches.find(b => (b.courseId?._id || b.courseId) === courseId && b.students?.some((s: any) => (s._id || s) === p.studentId?._id))
      if (batch) {
        batchName = batch.name
        batchId = batch._id
        status = getBatchStatus(p)
      }

      if (!grouped[batchId]) {
        grouped[batchId] = {
          batchId: batchId,
          batchName: batchName,
          courseName: courseName,
          status: status,
          payments: [],
          total: 0
        }
      }
      grouped[batchId].payments.push(p)
      grouped[batchId].total += p.totalAmount
    })
    return Object.values(grouped).sort((a: any, b: any) => a.batchName.localeCompare(b.batchName))
  }

  const generateMissingPayments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/payments/generate', { method: 'POST' })
      const data = await res.json()
      toast.success(data.message || 'Payments generated')
      fetchData()
    } catch (error) {
      toast.error('Failed to generate payments')
      setLoading(false)
    }
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader title="Payment Management" subtitle="Manage your platform fee payments securely." />
        {payments.length === 0 && !loading && (
          <Button onClick={generateMissingPayments} variant="outline" className="gap-2">
            Load Enrolled Students
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="bg-muted/30 border-none shadow-inner">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Institute</span>
              <span className="text-sm font-semibold truncate max-w-[200px]" title={instituteName}>
                {instituteName || 'Loading...'}
              </span>
            </div>
          </div>

          <div className="flex-1 relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Name or Roll No..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[180px] bg-background">
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
              <SelectTrigger className="w-[220px] bg-background">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {availableBatches.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showPastBatches ? "secondary" : "outline"}
              className="gap-2 whitespace-nowrap"
              onClick={() => setShowPastBatches(!showPastBatches)}
            >
              <History className="w-4 h-4" />
              {showPastBatches ? "Including Finished" : "Include Finished Batches"}
            </Button>

            {(searchQuery || filterCourse !== 'all' || filterBatch !== 'all' || showPastBatches) && (
              <Button variant="ghost" size="icon" onClick={() => {
                setSearchQuery('')
                setFilterCourse('all')
                setFilterBatch('all')
                setShowPastBatches(false)
              }} title="Reset Filters">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards (Simplified for compactness with filters) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* ... (Keep existing Stat Cards but update values to reflect FILTERED data for better context? Or keep Global? Usually Global stats are better on top, filtered in list. I'll keep Global for Top Stats) */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Pension Pending</p>
              <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
            </div>
            <IndianRupee className="text-orange-500 opacity-20 w-10 h-10" />
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Visible Students</p>
              <p className="text-2xl font-bold">{pendingPayments.length + filteredPaidPayments.length}</p>
            </div>
            <Users className="text-blue-500 opacity-20 w-10 h-10" />
          </div>
        </Card>
      </div>

      <div className="pb-6 flex flex-col items-center gap-4">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "pending", label: "Pending Payments", count: pendingPayments.length },
            { id: "history", label: "Paid Payments", count: filteredPaidPayments.length }
          ]}
        />
      </div>

      {activeTab === 'pending' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-lg">No Pending Payments Found</p>
              <p className="text-muted-foreground text-sm">Adjust filters or you are all caught up!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupPendingByBatch().map((group: any) => {
                const isAllSelected = group.payments.every((p: any) => selectedPayments.has(p._id))
                const selectedCount = group.payments.filter((p: any) => selectedPayments.has(p._id)).length
                const selectedTotal = group.payments.reduce((sum: number, p: any) => selectedPayments.has(p._id) ? sum + p.totalAmount : sum, 0)

                const matchedCourse = courses.find((c: any) => (c.courseId?._id || c.courseId) === group.courseId)
                const batchDeliveryCharge = matchedCourse?.courseId?.deliveryCharge || matchedCourse?.deliveryCharge || 0

                // Check Global Paid History (allPaid) for this batch/course to see if delivery was ever paid
                const isDeliveryPaid = allPaid.some((p: any) => (p.courseId?._id || p.courseId) === group.courseId && p.deliveryCharge > 0)

                const willAddDelivery = !isDeliveryPaid && selectedCount > 0 && batchDeliveryCharge > 0
                const finalTotal = selectedTotal + (willAddDelivery ? batchDeliveryCharge : 0)

                return (
                  <div key={group.batchId} className="border rounded-xl overflow-hidden shadow-sm bg-card transition-shadow">
                    <div className="bg-muted/30 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={selectedCount > 0 && isAllSelected} onChange={(e) => toggleBatchSelection(group.batchId, e.target.checked)} className="h-4 w-4" />
                          <div className="flex flex-col">
                            <h3 className="font-bold text-lg">{group.batchName}</h3>
                            <span className="text-xs text-muted-foreground">{group.courseName}</span>
                          </div>
                        </div>
                        <div className="pl-7 flex items-center gap-2 text-sm text-muted-foreground">
                          {isDeliveryPaid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" /> Delivery Charge Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" /> Delivery Charge Pending ({batchDeliveryCharge > 0 ? `₹${batchDeliveryCharge}` : 'Free'})
                            </Badge>
                          )}
                          {willAddDelivery && <span className="text-xs text-amber-600 font-medium animate-pulse">(+₹{batchDeliveryCharge} included)</span>}
                        </div>
                      </div>
                      <Button onClick={() => handlePaySelection(group.batchId)} size="sm" disabled={processing || selectedCount === 0}>
                        Pay ₹{finalTotal.toLocaleString()}
                      </Button>
                    </div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {group.payments.map((payment: any) => (
                        <div key={payment._id} className="p-3 flex justify-between items-center text-sm hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedPayments.has(payment._id)} onChange={() => toggleSelection(payment._id)} className="h-4 w-4 mt-1" />

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                {payment.studentId?.documents?.photo ? (
                                  <img src={payment.studentId.documents.photo} alt={payment.studentId.name} className="w-full h-full object-cover" />
                                ) : (
                                  (payment.studentId?.name || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-base">{payment.studentId?.name}</p>
                                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono bg-muted px-1 rounded">{payment.studentId?.rollNo}</span>
                                    {payment.studentId?.phone && <span>• {payment.studentId.phone}</span>}
                                  </div>
                                  {payment.studentId?.email && <span>{payment.studentId.email}</span>}
                                  <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground mt-1 items-center">
                                    <span title="Exam & Cert" className="bg-blue-50 text-blue-700 px-1.5 rounded">Exam: ₹{payment.examFee + payment.certificateCharge}</span>
                                    {payment.bookPrice > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 rounded">Books: ₹{payment.bookPrice}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-base">₹{payment.totalAmount.toLocaleString()}</p>
                            <span className="text-[10px] text-muted-foreground">Due Amount</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {filteredPaidPayments.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No payment history matches your filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupPaidByBatch().map((group: any) => (
                <div key={group.batchId} className="border rounded-xl overflow-hidden shadow-sm bg-card">
                  <div className="bg-muted/30 p-4 flex justify-between items-center border-b">
                    <div className="flex flex-col">
                      <h3 className="font-bold flex items-center gap-2 text-lg">
                        {group.batchName}
                        <Badge variant={group.status === 'Active' ? 'default' : 'secondary'}>{group.status}</Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">{group.courseName}</span>
                    </div>
                    <p className="font-bold text-green-600">Total: ₹{group.total.toLocaleString()}</p>
                  </div>
                  <div className="divide-y max-h-[300px] overflow-y-auto">
                    {group.payments.map((payment: any) => (
                      <div key={payment._id} className="p-3 flex justify-between items-center text-sm hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                            {payment.studentId?.documents?.photo ? (
                              <img src={payment.studentId.documents.photo} alt={payment.studentId.name} className="w-full h-full object-cover" />
                            ) : (
                              (payment.studentId?.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-base">{payment.studentId?.name}</p>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-green-600/80 font-medium">Paid: {new Date(payment.paidAt).toLocaleDateString()}</span>
                                <span className="text-gray-300">|</span>
                                <span className="font-mono">{payment.studentId?.rollNo}</span>
                              </div>
                              {payment.studentId?.email && <span>{payment.studentId.email}</span>}
                              <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground mt-1 items-center">
                                <span title="Exam & Cert" className="bg-blue-50 text-blue-700 px-1.5 rounded">Exam: ₹{((payment.examFee || 0) + (payment.certificateCharge || 0))}</span>
                                {payment.bookPrice > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 rounded">Books: ₹{payment.bookPrice}</span>}
                                {payment.deliveryCharge > 0 && <span className="bg-orange-50 text-orange-700 px-1.5 rounded">Delivery: ₹{payment.deliveryCharge}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="font-semibold text-green-700">₹{payment.totalAmount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

    </div>
  )
}
