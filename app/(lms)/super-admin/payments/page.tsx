'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { IndianRupee, Building2, BookOpen, Package, TrendingUp, CheckCircle, Clock, Eye, AlertCircle, Search, Filter, Download, ArrowRight } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"
import { motion } from "framer-motion"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [allBatches, setAllBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterInstitute, setFilterInstitute] = useState('all')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterBatch, setFilterBatch] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const [paymentsRes, batchesRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/batches')
      ])

      const paymentsData = await paymentsRes.json()
      const batchesData = await batchesRes.json()

      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      setAllBatches(Array.isArray(batchesData) ? batchesData : [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Derived Data & Filtering
  const institutes = Array.from(new Set(payments.map(p => JSON.stringify({ id: p.instituteId?._id, name: p.instituteId?.name }))))
    .map((s: string) => JSON.parse(s))
    .filter(i => i.id)

  const courses = Array.from(new Set(payments
    .filter(p => filterInstitute === 'all' || p.instituteId?._id === filterInstitute)
    .map(p => JSON.stringify({ id: p.courseId?._id, name: p.courseId?.name }))
  ))
    .map((s: string) => JSON.parse(s))
    .filter(c => c.id)

  const batches = allBatches.filter(b => {
    if (filterInstitute !== 'all' && (b.instituteId?._id || b.instituteId) !== filterInstitute) return false
    if (filterCourse !== 'all' && (b.courseId?._id || b.courseId) !== filterCourse) return false
    return true
  })

  const getFilteredPayments = (status: string) => {
    return payments.filter(p => {
      if (p.status !== status) return false

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesInst = p.instituteId?.name?.toLowerCase().includes(q)
        const matchesStudent = p.studentId?.name?.toLowerCase().includes(q)
        if (!matchesInst && !matchesStudent) return false
      }

      // Filters
      if (filterInstitute !== 'all' && p.instituteId?._id !== filterInstitute) return false
      if (filterCourse !== 'all' && (p.courseId?._id || p.courseId) !== filterCourse) return false

      if (filterBatch !== 'all') {
        const batch = allBatches.find(b => b._id === filterBatch)
        if (!batch) return false // Should not happen if filter is selected from valid list
        const studentId = p.studentId?._id || p.studentId
        const isInBatch = batch.students?.some((s: any) => (s._id || s) === studentId)
        if (!isInBatch) return false
      }

      return true
    })
  }

  const pendingPayments = getFilteredPayments('Pending')
  const paidPayments = getFilteredPayments('Paid')

  const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.totalAmount, 0)

  // Grouping Logic: Institute -> Course -> Batch
  const groupPayments = (list: any[]) => {
    const grouped: any = {}
    list.forEach(p => {
      const instId = p.instituteId?._id
      if (!instId) return

      // Init Institute Group
      if (!grouped[instId]) {
        grouped[instId] = { id: instId, name: p.instituteId.name, courses: {}, total: 0 }
      }
      grouped[instId].total += p.totalAmount

      // Init Course Group
      const courseId = p.courseId?._id
      if (!grouped[instId].courses[courseId]) {
        grouped[instId].courses[courseId] = { id: courseId, name: p.courseId.name, batches: {}, total: 0 }
      }
      grouped[instId].courses[courseId].total += p.totalAmount

      // Init Batch Group
      // Identify batch from allBatches using student ID or default to 'Unassigned'
      let batchName = 'Unassigned Batch'
      let batchId = 'unassigned'

      const batch = allBatches.find(b => (b.courseId?._id || b.courseId) === courseId && b.students?.some((s: any) => (s._id || s) === p.studentId?._id))
      if (batch) {
        batchName = batch.name
        batchId = batch._id
      }

      if (!grouped[instId].courses[courseId].batches[batchId]) {
        grouped[instId].courses[courseId].batches[batchId] = { id: batchId, name: batchName, items: [], total: 0 }
      }
      grouped[instId].courses[courseId].batches[batchId].items.push(p)
      grouped[instId].courses[courseId].batches[batchId].total += p.totalAmount
    })
    return Object.values(grouped).sort((a: any, b: any) => b.total - a.total)
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6 p-6 pb-20">
      <SectionHeader title="Super Admin Payments" subtitle="Monitor platform fees and collections from all institutes" />

      {/* Filter Bar */}
      <Card className="bg-muted/30 border-none shadow-inner">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Institute or Student..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <Select value={filterInstitute} onValueChange={(val) => {
              setFilterInstitute(val)
              setFilterCourse('all')
              setFilterBatch('all')
            }}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="All Institutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutes</SelectItem>
                {institutes.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCourse} onValueChange={(val) => {
              setFilterCourse(val)
              setFilterBatch('all')
            }}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || filterInstitute !== 'all' || filterCourse !== 'all' || filterBatch !== 'all') && (
              <Button variant="ghost" size="icon" onClick={() => {
                setSearchQuery('')
                setFilterInstitute('all')
                setFilterCourse('all')
                setFilterBatch('all')
              }} title="Reset Filters">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm p-4">
          <div>
            <p className="text-sm text-muted-foreground">Pending Collection</p>
            <p className="text-2xl font-bold">₹{(totalPending / 1000).toFixed(1)}K</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm p-4">
          <div>
            <p className="text-sm text-muted-foreground">Settled Amount</p>
            <p className="text-2xl font-bold">₹{(totalPaid / 1000).toFixed(1)}K</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">₹{((totalPending + totalPaid) / 1000).toFixed(1)}K</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm p-4">
          <div>
            <p className="text-sm text-muted-foreground">Active Institutes</p>
            <p className="text-2xl font-bold">{institutes.length}</p>
          </div>
        </Card>
      </div>

      <div className="flex justify-center pb-2">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "pending", label: "Pending Payments", count: pendingPayments.length },
            { id: "history", label: "Payment History", count: paidPayments.length },
          ]}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {(() => {
          const list = activeTab === 'pending' ? pendingPayments : paidPayments
          if (list.length === 0) {
            return (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium text-lg">No records found</p>
                <p className="text-muted-foreground text-sm">Adjust filters or check back later.</p>
              </div>
            )
          }

          const grouped = groupPayments(list)
          return grouped.map((instGroup: any) => (
            <div key={instGroup.id} className="border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{instGroup.name}</h3>
                    <p className="text-xs text-muted-foreground">{Object.keys(instGroup.courses).length} Courses Involved</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total {activeTab}</p>
                  <p className={`text-xl font-bold ${activeTab === 'pending' ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{instGroup.total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-background/50">
                {Object.values(instGroup.courses).map((courseGroup: any) => (
                  <div key={courseGroup.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/20 p-3 px-4 flex justify-between items-center border-b">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm">{courseGroup.name}</span>
                      </div>
                      <span className="font-mono text-sm font-medium">₹{courseGroup.total.toLocaleString()}</span>
                    </div>

                    <div className="p-0">
                      {Object.values(courseGroup.batches).map((batchGroup: any) => (
                        <div key={batchGroup.id} className="border-b last:border-0">
                          <div className="bg-muted/5 px-4 py-2 border-b border-dashed flex justify-between items-center text-xs">
                            <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <Package className="w-3.5 h-3.5" />
                              {batchGroup.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-5">{batchGroup.items.length} Records</Badge>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent bg-muted/5">
                                <TableHead className="w-[300px] pl-6">Student</TableHead>
                                <TableHead>Fee Breakdown</TableHead>
                                <TableHead className="text-right pr-6">Amout Due</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchGroup.items.map((item: any, idx: number) => (
                                <TableRow key={item._id} className="hover:bg-muted/30">
                                  <TableCell className="pl-6 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                        {item.studentId?.documents?.photo ? (
                                          <img src={item.studentId.documents.photo} alt={item.studentId.name} className="w-full h-full object-cover" />
                                        ) : (
                                          (item.studentId?.name || 'U').charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm text-foreground">{item.studentId?.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                          <span className="bg-muted px-1.5 rounded font-mono">{item.studentId?.rollNo}</span>
                                          {item.studentId?.phone && <span>• {item.studentId.phone}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground items-center">
                                      <span title="Exam & Certification" className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                        Exams: ₹{(item.examFee + item.certificateCharge).toLocaleString()}
                                      </span>
                                      {item.bookPrice > 0 && (
                                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                                          Books: ₹{item.bookPrice}
                                        </span>
                                      )}
                                      {item.deliveryCharge > 0 && (
                                        <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                                          Delivery: ₹{item.deliveryCharge}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium pr-6 text-foreground">₹{item.totalAmount.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        })()}
      </motion.div>

      {/* Breakdown Dialog (Kept for optional detail view if needed, but table covers most) */}
      {/* ... Removed old Layout ... */}
    </div>
  )
}
