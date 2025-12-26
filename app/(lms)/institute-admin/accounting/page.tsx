'use client'
// icon fix

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Link from "next/link"
import { Wallet, TrendingUp, TrendingDown, IndianRupee, Calendar, CreditCard, ArrowRight, Download, Printer, Users, Plus } from "lucide-react"
import Loader from "@/components/ui/loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("transactions")
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [data, setData] = useState<{ transactions: any[], stats: any }>({
    transactions: [],
    stats: { totalIncome: 0, totalExpense: 0, netProfit: 0, cashInHand: 0 }
  })
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchAccountingData()
    }
  }, [instituteId])

  const fetchAccountingData = async () => {
    try {
      const res = await fetch(`/api/accounting/transactions?instituteId=${instituteId}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch accounting")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      instituteId,
      type: formData.get('type'),
      category: formData.get('category'),
      amount: Number(formData.get('amount')),
      description: formData.get('description'),
      date: formData.get('date'),
      mode: formData.get('mode')
    }

    try {
      const res = await fetch('/api/accounting/transactions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Transaction recorded successfully')
        setAddOpen(false)
        fetchAccountingData()
      } else {
        toast.error('Failed to record transaction')
      }
    } catch (error) {
      toast.error('Error recording transaction')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const { transactions, stats } = data

  return (
    <div className="space-y-6">
      <SectionHeader title="Accounting" subtitle="Track institute finances, earnings, expenses, and staff payroll." />

      <div className="grid gap-4 sm:grid-cols-4">
        {/* Income Card */}
        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Income</p>
            </div>
            <p className="text-2xl font-bold">₹{(stats.totalIncome || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">From Student Fees</p>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="relative overflow-hidden border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Total Expense</p>
            </div>
            <p className="text-2xl font-bold">₹{(stats.totalExpense || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Royalty & Salaries</p>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <IndianRupee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Net Profit</p>
            </div>
            <p className="text-2xl font-bold">₹{(stats.netProfit || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.netProfit >= 0 ? 'Surplus' : 'Deficit'}</p>
          </CardContent>
        </Card>

        {/* Cash in Hand Card */}
        <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Cash Flow</p>
            </div>
            <p className="text-2xl font-bold">₹{(stats.cashInHand || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Calculated Balance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-center">
            <AnimatedTabsProfessional
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: "transactions", label: "Recent Transactions", count: transactions.length },
                { id: "daybook", label: "Day Book" },
                { id: "pl", label: "P&L Statement" }
              ]}
            />
          </div>

          {activeTab === 'transactions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <CardDescription>Latest financial activity recorded.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      No transactions found.
                    </div>
                  ) : transactions.map((txn: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:shadow-sm hover:bg-muted/30 transition-all gap-4">

                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${txn.type === "Income" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                          {txn.type === "Income" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{txn.category}</p>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{txn.id.slice(0, 10)}...</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            {txn.party} • {txn.date}
                          </p>
                          <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{txn.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
                        <div className="flex flex-col sm:items-end">
                          <p className={`font-bold ${txn.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                            {txn.type === "Income" ? "+" : "-"}₹{txn.amount?.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CreditCard className="w-3 h-3" /> {txn.mode}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" asChild>
                      <Link href="/institute-admin/accounting/transactions">View All Transactions</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'daybook' && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Day Book Module Coming Soon</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'pl' && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Download className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Profit & Loss Statement Module Coming Soon</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <IndianRupee className="w-4 h-4 text-orange-600" />
                </div>
                <CardTitle className="text-base text-orange-800 dark:text-orange-400">Payment to Super Admin</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Pending Dues</p>
                <p className="text-3xl font-bold text-orange-600">₹{(stats.pendingRoyalty || 0).toLocaleString()}</p>
                <div className="h-1.5 w-full bg-orange-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${Math.min(((stats.pendingRoyalty || 0) / 100000) * 100, 100)}%` }} />
                </div>
                <p className="text-[10px] text-right mt-1 text-orange-600 font-medium">To be paid immediately</p>
              </div>

              <div className="space-y-2 bg-white dark:bg-background p-3 rounded-lg border text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Course Fees</span>
                  <span>₹{(stats.pendingCourseFees || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Books & Materials</span>
                  <span>₹{(stats.pendingBookFees || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Payable</span>
                  <span>₹{(stats.pendingRoyalty || 0).toLocaleString()}</span>
                </div>
              </div>

              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20" disabled={(stats.pendingRoyalty || 0) <= 0}>
                Generate Invoice & Pay <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start h-10 px-4 group bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddOpen(true)}>
                <div className="bg-white/20 p-1.5 rounded-md mr-3 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                Add Manual Payment/Expense
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 px-4 group" asChild>
                <a href="/accounting/student-fees">
                  <div className="bg-primary/10 p-1.5 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  Student Fees Overview
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 px-4 group" asChild>
                <a href="/master/salary/add">
                  <div className="bg-primary/10 p-1.5 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  Manage Salaries
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 px-4 group">
                <div className="bg-primary/10 p-1.5 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                  <Printer className="w-4 h-4 text-primary" />
                </div>
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Transaction</DialogTitle>
            <DialogDescription>Manually record an income or expense.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="type" defaultValue="Expense">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense">Expense (Spending)</SelectItem>
                  <SelectItem value="Income">Income (Earning)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" defaultValue="Miscellaneous">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Utilities">Utilities (Electricity/Water)</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Salary">Salary (Ad-hoc)</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input name="amount" type="number" required min="1" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Description / Party Name</Label>
              <Input name="description" placeholder="e.g. Paid for Office Paint" required />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select name="mode" defaultValue="Cash">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
