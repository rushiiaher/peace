'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Wallet, TrendingUp, TrendingDown, IndianRupee, Calendar, Building2, Plus, Filter } from "lucide-react"

import Link from 'next/link'
import Loader from "@/components/ui/loader"

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [institutes, setInstitutes] = useState<any[]>([])
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, commissionEarned: 0, feeCollection: 0 })
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterInstitute, setFilterInstitute] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [filterType, filterInstitute, startDate, endDate])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterInstitute !== 'all') params.append('instituteId', filterInstitute)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const [txnRes, statsRes, instRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch(`/api/accounting/stats?${params}`),
        fetch('/api/institutes')
      ])

      const [txnData, statsData, instData] = await Promise.all([
        txnRes.json(),
        statsRes.json(),
        instRes.json()
      ])

      setTransactions(Array.isArray(txnData) ? txnData : [])
      setStats(statsData)
      setInstitutes(Array.isArray(instData) ? instData : [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      type: formData.get('type'),
      category: formData.get('category'),
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      instituteId: formData.get('instituteId') || undefined,
      commission: Number(formData.get('commission')) || 0,
      date: formData.get('date')
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Transaction added successfully')
        setAddOpen(false)
        fetchData()
        e.currentTarget.reset()
      } else {
        toast.error('Failed to add transaction')
      }
    } catch (error) {
      toast.error('Failed to add transaction')
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`
    return `₹${amount.toLocaleString()}`
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            Account Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Track income, expenses, and commissions</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Add Transaction</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <p className="text-sm text-muted-foreground">Log a new income or expense entry.</p>
            </DialogHeader>
            <form onSubmit={handleAddTransaction} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">Income (Credit)</SelectItem>
                      <SelectItem value="Expense">Expense (Debit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fee Collection">Fee Collection</SelectItem>
                      <SelectItem value="Commission">Commission</SelectItem>
                      <SelectItem value="Server Cost">Server Cost</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Enter transaction details..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="amount" name="amount" type="number" min="0" className="pl-9" placeholder="0.00" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instituteId">Institute (Optional)</Label>
                  <Select name="instituteId">
                    <SelectTrigger>
                      <SelectValue placeholder="Link Institute" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((inst: any) => (
                        <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Earned</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="commission" name="commission" type="number" min="0" defaultValue="0" className="pl-9" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">Add Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <IndianRupee className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fee Collection</p>
                <p className="text-2xl font-bold text-purple-600">{formatAmount(stats.feeCollection)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expense</p>
                <p className="text-2xl font-bold text-red-600">{formatAmount(stats.totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.commissionEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="grid gap-4 md:grid-cols-4 flex-1 w-full">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Institute</Label>
                <Select value={filterInstitute} onValueChange={setFilterInstitute}>
                  <SelectTrigger className="bg-background border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Institutes</SelectItem>
                    {institutes.map((inst: any) => (
                      <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Start Date</Label>
                <Input
                  type="date"
                  className="bg-background border-muted-foreground/20"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">End Date</Label>
                <Input
                  type="date"
                  className="bg-background border-muted-foreground/20"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {(filterType !== 'all' || filterInstitute !== 'all' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType('all')
                  setFilterInstitute('all')
                  setStartDate('')
                  setEndDate('')
                }}
                className="text-muted-foreground hover:text-foreground shrink-0 mb-0.5"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Day Book</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any) => (
                <div key={txn._id} className={`flex items-center justify-between border-2 rounded-lg p-4 hover:shadow-md transition-all ${txn.type === "Income"
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${txn.type === "Income"
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-red-100 dark:bg-red-900"
                      }`}>
                      {txn.type === "Income" ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">{txn.category}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                        {txn.instituteId && (
                          <>
                            <span>•</span>
                            <Building2 className="w-3 h-3" />
                            <span>{txn.instituteId.name}</span>
                          </>
                        )}
                        {txn.commission > 0 && (
                          <>
                            <span>•</span>
                            <span>Commission: ₹{txn.commission.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${txn.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                      {txn.type === "Income" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                    </p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${txn.type === "Income"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}>
                      {txn.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
