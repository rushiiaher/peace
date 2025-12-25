'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, Clock, User, FileText, ArrowLeft, RefreshCw, Calendar } from "lucide-react"
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"

export default function RescheduleApprovalsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
    const [processing, setProcessing] = useState(false)

    // Filter state
    const [statusFilter, setStatusFilter] = useState('Pending')

    useEffect(() => {
        fetchRequests()
    }, [statusFilter])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/exams/reschedule-requests?status=${statusFilter}`)
            const data = await res.json()
            setRequests(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to fetch requests')
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedRequests)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedRequests(newSet)
    }

    const handleProcess = async (approve: boolean) => {
        if (selectedRequests.size === 0) return

        setProcessing(true)
        try {
            const res = await fetch('/api/exams/reschedule-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestIds: Array.from(selectedRequests),
                    approve
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(approve ? `Approved & Scheduled! Created ${data.scheduledExams?.length || 0} exams.` : 'Requests Rejected')
                setSelectedRequests(new Set())
                fetchRequests()
            } else {
                toast.error(data.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('Operation failed')
        } finally {
            setProcessing(false)
        }
    }

    // Group requests by Original Exam for better display
    const groupedRequests: { [key: string]: any[] } = {}
    requests.forEach(r => {
        const key = r.originalExamId?._id || 'unknown'
        if (!groupedRequests[key]) groupedRequests[key] = []
        groupedRequests[key].push(r)
    })

    // Helper to get group title
    const getGroupTitle = (requests: any[]) => {
        if (!requests[0]?.originalExamId) return 'Unknown Exam'
        return `${requests[0].originalExamId.title} (${new Date(requests[0].originalExamId.date).toLocaleDateString()})`
    }

    const getGroupInstitute = (requests: any[]) => requests[0]?.instituteId?.name || 'Unknown Institute'

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/exams"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <SectionHeader title="Reschedule Requests" subtitle="Approve student reschedule requests and auto-schedule exams." />
            </div>

            <div className="flex gap-2">
                {['Pending', 'Approved', 'Rejected'].map(status => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(status)}
                        size="sm"
                    >
                        {status}
                    </Button>
                ))}
            </div>

            {statusFilter === 'Pending' && selectedRequests.size > 0 && (
                <Card className="sticky top-4 z-10 border-blue-200 bg-blue-50">
                    <CardContent className="p-4 flex justify-between items-center">
                        <span className="font-medium text-blue-900">{selectedRequests.size} requests selected</span>
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleProcess(false)}
                                disabled={processing}
                            >
                                Reject Selected
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleProcess(true)}
                                disabled={processing}
                            >
                                {processing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-2" />}
                                Approve & Schedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {Object.keys(groupedRequests).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">No {statusFilter} requests found.</div>
            ) : (
                <div className="space-y-6">
                    {Object.values(groupedRequests).map((group, idx) => (
                        <Card key={idx} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" />
                                            {getGroupTitle(group)}
                                        </CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <span className="font-medium text-foreground mr-2">{getGroupInstitute(group)}</span>
                                            • {group[0]?.courseId?.name}
                                        </CardDescription>
                                    </div>
                                    {statusFilter === 'Pending' && (
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                const newSet = new Set(selectedRequests)
                                                const allSelected = group.every(r => newSet.has(r._id))
                                                group.forEach(r => allSelected ? newSet.delete(r._id) : newSet.add(r._id))
                                                setSelectedRequests(newSet)
                                            }}>
                                                {group.every(r => selectedRequests.has(r._id)) ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <div className="divide-y">
                                {group.map(req => (
                                    <div key={req._id} className="p-4 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                                        {statusFilter === 'Pending' && (
                                            <Checkbox
                                                checked={selectedRequests.has(req._id)}
                                                onCheckedChange={() => toggleSelection(req._id)}
                                                className="mt-1"
                                            />
                                        )}
                                        <div className="flex-1 grid md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{req.studentId?.name}</span>
                                                    <span className="text-xs text-muted-foreground">({req.studentId?.rollNo})</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50/50 p-2 rounded text-sm border-l-2 border-yellow-200">
                                                <span className="font-semibold text-yellow-800 text-xs uppercase block mb-1">Reason</span>
                                                {req.reason}
                                            </div>
                                        </div>
                                        {req.status !== 'Pending' && (
                                            <Badge variant={req.status === 'Approved' ? 'default' : 'destructive'}>
                                                {req.status}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
