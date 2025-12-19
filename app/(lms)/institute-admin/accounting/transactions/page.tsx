'use client'

import { useState } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Search, Filter, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

export default function TransactionsPage() {
    const [filter, setFilter] = useState("all")

    // Mock Data (Expanded)
    const transactions = Array.from({ length: 20 }).map((_, i) => ({
        id: `TXN${1000 + i}`,
        type: i % 3 === 0 ? "Expense" : "Income",
        category: i % 3 === 0 ? (i % 2 === 0 ? "Salary" : "Rent") : "Student Fees",
        party: i % 3 === 0 ? "Staff/Vendor" : `Student ${i + 1}`,
        amount: (Math.random() * 10000 + 1000).toFixed(0),
        mode: ["UPI", "Cash", "Bank Transfer"][math_floor(Math.random() * 3)],
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
    }))

    const filtered = transactions.filter(t => filter === 'all' || t.type.toLowerCase() === filter)

    function math_floor(x: number) { return Math.floor(x); }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/institute-admin/accounting">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <SectionHeader title="All Transactions" subtitle="History of all financial movements." />
            </div>

            <Card>
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by ID, Party..." className="pl-9 bg-background" />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[150px] bg-background">
                                    <SelectValue placeholder="Filter Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="income">Income Only</SelectItem>
                                    <SelectItem value="expense">Expense Only</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="gap-2 bg-background">
                                <Download className="w-4 h-4" /> Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {filtered.map((txn) => (
                            <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-full ${txn.type === "Income" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                                        {txn.type === "Income" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{txn.category}</p>
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{txn.id}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            {txn.party} • {txn.date} • {txn.mode}
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-bold ${txn.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                                    {txn.type === "Income" ? "+" : "-"}₹{Number(txn.amount).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
