'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Filter } from "lucide-react"
import Link from 'next/link'

export default function RescheduleRequestPage() {
    const [instituteId, setInstituteId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Data Stores
    const [allCourses, setAllCourses] = useState<any[]>([])
    const [allBatches, setAllBatches] = useState<any[]>([])
    const [allExams, setAllExams] = useState<any[]>([])
    const [existingRequests, setExistingRequests] = useState<any[]>([]) // Track existing requests

    // Selection State
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [selectedBatchId, setSelectedBatchId] = useState<string>('')
    const [selectedExamId, setSelectedExamId] = useState<string>('')

    // Form State
    const [studentsToDisplay, setStudentsToDisplay] = useState<any[]>([])
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    const [reasons, setReasons] = useState<{ [key: string]: string }>({})
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (user) {
            const userData = JSON.parse(user)
            setInstituteId(userData.instituteId)
        }
    }, [])

    useEffect(() => {
        if (instituteId) fetchData()
    }, [instituteId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [coursesRes, batchesRes, examsRes, requestsRes] = await Promise.all([
                fetch(`/api/institutes/${instituteId}/courses`),
                fetch(`/api/batches?instituteId=${instituteId}`),
                fetch(`/api/exams`),
                fetch(`/api/exams/reschedule-requests?instituteId=${instituteId}`) // Fetch existing requests
            ])

            const courses = await coursesRes.json()
            const batches = await batchesRes.json()
            const exams = await examsRes.json()
            const requests = await requestsRes.json()

            setAllCourses(Array.isArray(courses) ? courses : [])
            setAllBatches(Array.isArray(batches) ? batches : [])
            setExistingRequests(Array.isArray(requests) ? requests : [])

            const relevantExams = Array.isArray(exams) ? exams.filter((e: any) =>
                (e.instituteId?._id === instituteId || e.instituteId === instituteId) && e.type === 'Final'
            ) : []
            setAllExams(relevantExams)

        } catch (error) {
            toast.error('Failed to load initial data')
        } finally {
            setLoading(false)
        }
    }

    // Effect: Update displayed students when Exam or Batch changes
    useEffect(() => {
        if (!selectedExamId) {
            setStudentsToDisplay([])
            return
        }

        const exam = allExams.find(e => e._id === selectedExamId)
        if (!exam) return

        // 1. Get all students from Exam System Assignments (Flattened)
        const examStudentsMap = new Map<string, any>()

        // Check top level assignments
        exam.systemAssignments?.forEach((assign: any) => {
            if (assign.studentId && assign.studentId._id) {
                examStudentsMap.set(assign.studentId._id, {
                    id: assign.studentId._id,
                    name: assign.studentId.name,
                    rollNo: assign.studentId.rollNo,
                    attended: assign.attended
                })
            }
        })

        // Check sections assignments
        exam.sections?.forEach((sec: any) => {
            sec.systemAssignments?.forEach((assign: any) => {
                if (assign.studentId && assign.studentId._id) {
                    examStudentsMap.set(assign.studentId._id, {
                        id: assign.studentId._id,
                        name: assign.studentId.name,
                        rollNo: assign.studentId.rollNo,
                        attended: assign.attended
                    })
                }
            })
        })

        let finalStudents = Array.from(examStudentsMap.values())

        // 2. Filter by Batch if selected
        if (selectedBatchId) {
            const batch = allBatches.find(b => b._id === selectedBatchId)
            if (batch && batch.students) {
                const batchStudentIds = new Set(batch.students.map((s: any) => s._id || s))
                finalStudents = finalStudents.filter(s => batchStudentIds.has(s.id))
            }
        }

        setStudentsToDisplay(finalStudents)

        // Reset selections if exam changed
        setSelectedStudents(new Set())
        setReasons({})

    }, [selectedExamId, selectedBatchId, allExams, allBatches])


    // Helpers for Dropdown Options
    const filteredBatches = allBatches.filter(b =>
        !selectedCourseId || (b.courseId?._id || b.courseId) === selectedCourseId
    )

    const filteredExams = allExams.filter(e =>
        !selectedCourseId || (e.courseId?._id || e.courseId) === selectedCourseId
    )

    const handleReasonChange = (studentId: string, value: string) => {
        setReasons(prev => ({ ...prev, [studentId]: value }))
    }

    const toggleStudent = (studentId: string) => {
        const newSet = new Set(selectedStudents)
        if (newSet.has(studentId)) {
            newSet.delete(studentId)
            const newReasons = { ...reasons }
            delete newReasons[studentId]
            setReasons(newReasons)
        } else {
            newSet.add(studentId)
        }
        setSelectedStudents(newSet)
    }

    // Helper to get existing request status for a student
    const getStudentRequestStatus = (studentId: string) => {
        if (!selectedExamId) return null
        const request = existingRequests.find(r =>
            (r.studentId?._id || r.studentId) === studentId &&
            (r.originalExamId?._id || r.originalExamId) === selectedExamId
        )
        return request
    }

    const handleSubmit = async () => {
        if (selectedStudents.size === 0) {
            toast.error('Select at least one student')
            return
        }

        for (const sid of Array.from(selectedStudents)) {
            if (!reasons[sid] || reasons[sid].trim().length < 5) {
                toast.error('Please provide a valid reason (min 5 chars) for each selected student')
                return
            }
        }

        setSubmitting(true)
        try {
            const requests = Array.from(selectedStudents).map(sid => ({
                studentId: sid,
                reason: reasons[sid]
            }))

            const res = await fetch('/api/exams/reschedule-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instituteId,
                    originalExamId: selectedExamId,
                    requests
                })
            })

            const data = await res.json()

            if (res.ok) {
                if (data.created > 0) {
                    toast.success(`${data.created} reschedule request(s) sent to Super Admin`)
                }
                if (data.skipped > 0) {
                    toast.warning(`${data.skipped} student(s) already have pending/approved requests`)
                }
                setSelectedStudents(new Set())
                setReasons({})
                // Refresh existing requests to show new ones
                fetchData()
            } else {
                toast.error(data.error || 'Failed to submit requests')
            }
        } catch (error) {
            toast.error('Submission error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/institute-admin/exams"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <SectionHeader title="Request Reschedule" subtitle="Filter by Course & Batch to find previous exams." />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-muted-foreground" />
                        Find Exam
                    </CardTitle>
                    <CardDescription>Select Course and Batch to locate the specific exam.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">1. Select Course</label>
                            <Select value={selectedCourseId} onValueChange={(val) => {
                                setSelectedCourseId(val)
                                setSelectedBatchId('')
                                setSelectedExamId('')
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {allCourses.map((c: any) => (
                                        <SelectItem key={c.courseId._id} value={c.courseId._id}>
                                            {c.courseId.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">2. Select Batch</label>
                            <Select value={selectedBatchId} onValueChange={(val) => {
                                setSelectedBatchId(val === 'all' ? '' : val)
                                // We don't necessarily clear exam here, assuming exam might be cross-batch? 
                                // But usually better to clear to avoid confusion.
                                // setSelectedExamId('') 
                            }} disabled={!selectedCourseId || selectedCourseId === 'all'}>
                                <SelectTrigger>
                                    <SelectValue placeholder={!selectedCourseId ? "Select Course First" : "All Batches"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Batches</SelectItem>
                                    {filteredBatches.map(b => (
                                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">3. Select Completed Exam</label>
                            <Select value={selectedExamId} onValueChange={setSelectedExamId} disabled={!selectedCourseId && filteredExams.length > 20}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose Exam..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredExams.length === 0 ? (
                                        <SelectItem value="none" disabled>No exams found</SelectItem>
                                    ) : (
                                        filteredExams.map(e => (
                                            <SelectItem key={e._id} value={e._id}>
                                                {e.title} ({new Date(e.date).toLocaleDateString()})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedExamId && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <CardTitle>Students in Exam</CardTitle>
                        <CardDescription>
                            {selectedBatchId ? 'Showing students from selected batch.' : 'Showing all students in this exam.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {studentsToDisplay.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                No students found matching criteria.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Select</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Attendance Status</TableHead>
                                            <TableHead>Request Status</TableHead>
                                            <TableHead>Reason for Reschedule</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsToDisplay.map(student => {
                                            const existingRequest = getStudentRequestStatus(student.id)
                                            const hasActiveRequest = existingRequest &&
                                                (existingRequest.status === 'Pending' || existingRequest.status === 'Approved')

                                            return (
                                                <TableRow key={student.id} className={hasActiveRequest ? 'bg-muted/30' : ''}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedStudents.has(student.id)}
                                                            onCheckedChange={() => toggleStudent(student.id)}
                                                            disabled={hasActiveRequest}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{student.name}</div>
                                                            <div className="text-xs text-muted-foreground">{student.rollNo}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {student.attended ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                                                                Present
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                                                                Absent
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {existingRequest ? (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${existingRequest.status === 'Pending'
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    : existingRequest.status === 'Approved'
                                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {existingRequest.status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No request</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {existingRequest && hasActiveRequest ? (
                                                            <div className="text-sm text-muted-foreground italic">
                                                                {existingRequest.reason}
                                                            </div>
                                                        ) : selectedStudents.has(student.id) ? (
                                                            <Textarea
                                                                placeholder="Describe reason (e.g. Medical, Tech Issue)..."
                                                                value={reasons[student.id] || ''}
                                                                onChange={(e) => handleReasonChange(student.id, e.target.value)}
                                                                className="min-h-[80px] text-sm"
                                                            />
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                        }
                                    </TableBody>
                                </Table>

                                <div className="pt-4 flex justify-end border-t">
                                    <Button onClick={handleSubmit} disabled={submitting || selectedStudents.size === 0} className="w-[200px]">
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Submit Reschedule Request
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )
            }
        </div >
    )
}
