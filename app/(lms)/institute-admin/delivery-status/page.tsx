'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Package, CheckCircle2, BookOpen, ScrollText, Filter, Search, Trash2, Mail, Phone } from "lucide-react"

export default function DeliveryStatusPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [instituteId, setInstituteId] = useState<string | null>(null)

    // Filter States
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedBatch, setSelectedBatch] = useState("all")
    const [searchQuery, setSearchQuery] = useState('')

    const [activeTab, setActiveTab] = useState("books")

    // Data States
    const [students, setStudents] = useState<any[]>([]) // For Books
    const [results, setResults] = useState<any[]>([])   // For Certificates
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.instituteId) {
            setInstituteId(user.instituteId)
        }
    }, [])

    useEffect(() => {
        if (instituteId) fetchCourses()
    }, [instituteId])

    const fetchCourses = async () => {
        const res = await fetch(`/api/institutes/${instituteId}`)
        const data = await res.json()
        setCourses(data.courses || [])
    }

    const fetchBatches = async () => {
        if (selectedCourse === 'all') {
            setBatches([])
            return
        }
        const res = await fetch(`/api/batches?instituteId=${instituteId}&courseId=${selectedCourse}`)
        setBatches(await res.json())
    }

    // Cascade: Reset batch when course changes
    useEffect(() => {
        if (selectedCourse !== 'all') {
            fetchBatches()
            setSelectedBatch('all')
        } else {
            setBatches([])
        }
    }, [selectedCourse])

    // Load Data Effect
    useEffect(() => {
        // Only load if filters allow, but similar to Inventory, we could allow broad fetch.
        // But for "Receive", we typically want specific batches.
        // Let's allow loading "All" if user wants? Or stick to safe approach.
        // User asked to "improve" - typically implies consistency with other improved pages.
        // I will implement similar logic: If a course is selected, or batch, fetch.

        setSelectedIds([])

        if (instituteId) {
            if (activeTab === 'books') {
                if (selectedCourse !== 'all') fetchBookData()
                else setStudents([])
            } else {
                if (selectedCourse !== 'all') fetchCertificateData()
                else setResults([])
            }
        }

    }, [instituteId, selectedCourse, selectedBatch, activeTab])

    const fetchBookData = async () => {
        setLoading(true)
        try {
            // Updated to be more flexible, fetch based on course and optional batch
            let url = `/api/users?instituteId=${instituteId}&role=student&courseId=${selectedCourse}&royaltyPaid=true`
            if (selectedBatch !== 'all') url += `&batchId=${selectedBatch}`

            const res = await fetch(url)
            const data = await res.json()

            // Client-side filter for now to only show those Dispatched (pending receive or received)
            const dispatchedOnly = (Array.isArray(data) ? data : []).filter((s: any) => {
                const enroll = s.courses?.find((c: any) => (c.courseId?._id || c.courseId) === selectedCourse)
                return enroll?.booksDispatched
            })
            setStudents(dispatchedOnly)
        } finally {
            setLoading(false)
        }
    }

    const fetchCertificateData = async () => {
        setLoading(true)
        try {
            let url = `/api/final-results?instituteId=${instituteId}&courseId=${selectedCourse}`
            if (selectedBatch !== 'all') url += `&batchId=${selectedBatch}`

            const res = await fetch(url)
            const data = await res.json()
            const dispatchedOnly = (Array.isArray(data) ? data : []).filter((r: any) => r.certificateDispatched)
            setResults(dispatchedOnly)
        } finally {
            setLoading(false)
        }
    }

    const handleReceive = async (type: 'book' | 'certificate') => {
        if (selectedIds.length === 0) return toast.error("Select items")

        try {
            const res = await fetch('/api/inventory/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    ids: selectedIds,
                    courseId: selectedCourse
                })
            })

            if (res.ok) {
                toast.success(`Marked as Received`)
                setSelectedIds([])
                if (type === 'book') fetchBookData()
                else fetchCertificateData()
            }
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const selectAll = (ids: string[]) => {
        if (selectedIds.length === ids.length) setSelectedIds([])
        else setSelectedIds(ids)
    }

    const getEnrollment = (student: any) => student.courses?.find((c: any) => (c.courseId?._id || c.courseId) === selectedCourse)

    // Client-side filtering
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const filteredResults = results.filter(res =>
        res.studentId?.name.toLowerCase().includes(searchQuery.toLowerCase())
        // Add roll no check if available
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <SectionHeader title="Delivery Status" subtitle="Track and acknowledge receipt of inventory" />

                <div className="flex justify-center w-full">
                    <AnimatedTabsProfessional
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: "books", label: "Books / Study Material", count: filteredStudents.length },
                            { id: "certificates", label: "Certificates", count: filteredResults.length },
                        ]}
                    />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Search & Filter</h3>
                    </div>
                    {(searchQuery || selectedCourse !== 'all' || selectedBatch !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => { setSearchQuery(''); setSelectedCourse('all'); setSelectedBatch('all'); }}
                        >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name, roll no, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 focus:bg-background transition-colors"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-background/50">
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select Course</SelectItem>
                                {courses.map((c: any) => (
                                    <SelectItem key={c._id || c.courseId._id} value={c.courseId._id}>{c.courseId.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={selectedCourse === 'all'}>
                            <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                                <SelectValue placeholder="Select Batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Batches</SelectItem>
                                {batches.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Content for Books */}
            {activeTab === "books" && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-4">
                        {filteredStudents.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={() => handleReceive('book')} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-4 h-4" /> Mark {selectedIds.length} Received
                                </Button>
                            </div>
                        )}

                        <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            {filteredStudents.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground bg-muted/20 border-dashed m-2 rounded-lg border">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium text-foreground">No pending deliveries found</p>
                                    <p className="text-sm">Select a Course to view incoming shipments</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12 pl-4"><Checkbox onCheckedChange={() => selectAll(filteredStudents.map(s => s._id))} checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} /></TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Dispatch Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map(student => {
                                            const enroll = getEnrollment(student)
                                            const isReceived = enroll?.booksReceived
                                            return (
                                                <TableRow key={student._id} className="group hover:bg-muted/30 transition-colors">
                                                    <TableCell className="pl-4"><Checkbox checked={selectedIds.includes(student._id)} onCheckedChange={() => toggleSelection(student._id)} disabled={isReceived} /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{student.name}</p>
                                                                <p className="text-xs text-muted-foreground">{student.motherName || 'No Mother Name'}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                                                            {student.rollNo || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Mail className="w-3 h-3 text-primary/70" />
                                                                <span className="truncate max-w-[150px]">{student.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Phone className="w-3 h-3 text-primary/70" />
                                                                <span>{student.phone || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isReceived ?
                                                            <Badge className="bg-green-500 hover:bg-green-600">Received</Badge> :
                                                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">In Transit</Badge>
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs italic">
                                                        Sent by Super Admin
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Content for Certificates */}
            {activeTab === "certificates" && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-4">
                        {filteredResults.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={() => handleReceive('certificate')} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-4 h-4" /> Mark {selectedIds.length} Received
                                </Button>
                            </div>
                        )}

                        <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            {filteredResults.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground bg-muted/20 border-dashed m-2 rounded-lg border">
                                    <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium text-foreground">No pending certificates found</p>
                                    <p className="text-sm">Select a Course to view incoming certificates</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12 pl-4"><Checkbox onCheckedChange={() => selectAll(filteredResults.map(r => r._id))} checked={selectedIds.length === filteredResults.length && filteredResults.length > 0} /></TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Mother's Name</TableHead>
                                            <TableHead>Result Info</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.map(res => (
                                            <TableRow key={res._id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell className="pl-4"><Checkbox checked={selectedIds.includes(res._id)} onCheckedChange={() => toggleSelection(res._id)} disabled={res.certificateReceived} /></TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shadow-sm ring-2 ring-background">
                                                            {res.studentId?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{res.studentId?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{res.studentId?.motherName || '---'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    Score: {res.percentage}%
                                                </TableCell>
                                                <TableCell>
                                                    {res.certificateReceived ?
                                                        <Badge className="bg-green-500 hover:bg-green-600">Received</Badge> :
                                                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">In Transit</Badge>
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
