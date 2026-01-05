'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Calendar, Clock, Users, Monitor, AlertCircle, CheckCircle, Save, ArrowLeft, RefreshCw } from "lucide-react"
import Loader from "@/components/ui/loader"
import { Separator } from "@/components/ui/separator"

export default function EditExamPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [exam, setExam] = useState<any>(null)
    const [institute, setInstitute] = useState<any>(null)

    // Form state
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [availableSystems, setAvailableSystems] = useState<any[]>([])
    const [allSystems, setAllSystems] = useState<any[]>([])
    const [busySystems, setBusySystems] = useState<Set<string>>(new Set())
    const [studentAssignments, setStudentAssignments] = useState<any[]>([])
    const [checkingAvailability, setCheckingAvailability] = useState(false)

    useEffect(() => {
        fetchExam()
    }, [examId])

    useEffect(() => {
        if (date && startTime && exam) {
            checkSystemAvailability()
        }
    }, [date, startTime])

    const fetchExam = async () => {
        try {
            const res = await fetch(`/api/exams/${examId}`)
            if (!res.ok) throw new Error('Failed to fetch exam')

            const examData = await res.json()
            setExam(examData)

            // Set initial form values
            const examDate = new Date(examData.date)
            setDate(examDate.toISOString().split('T')[0])
            setStartTime(examData.startTime)

            // Fetch institute data - FIXED: Get instituteId properly
            const instituteId = examData.instituteId?._id || examData.instituteId
            const instRes = await fetch(`/api/institutes/${instituteId}`)
            if (!instRes.ok) throw new Error('Failed to fetch institute')

            const instData = await instRes.json()
            setInstitute(instData)
            setAllSystems(instData.systems || [])

            // Initialize student assignments
            setStudentAssignments(examData.systemAssignments || [])

            setLoading(false)
        } catch (error: any) {
            console.error('Fetch exam error:', error)
            toast.error(error.message || 'Failed to load exam')
            setLoading(false)
        }
    }

    const checkSystemAvailability = async () => {
        if (!date || !startTime || !exam || !institute) {
            toast.error('Missing required data')
            return
        }

        setCheckingAvailability(true)
        try {
            // Calculate exam end time
            const examDateTime = new Date(`${date}T${startTime}`)
            const duration = exam.duration || 60
            const endDateTime = new Date(examDateTime.getTime() + duration * 60000)
            const endTime = endDateTime.toTimeString().slice(0, 5)

            // Calculate time in minutes for comparison
            const getMinutes = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number)
                return h * 60 + m
            }

            const examStartMins = getMinutes(startTime)
            const examEndMins = getMinutes(endTime)

            // VALIDATE OPENING/CLOSING HOURS
            const { examTimings } = institute
            if (examTimings) {
                const openMins = getMinutes(examTimings.openingTime || '09:00')
                const closeMins = getMinutes(examTimings.closingTime || '18:00')

                if (examStartMins < openMins) {
                    toast.error(`Exam cannot start before opening time (${examTimings.openingTime})`)
                    setCheckingAvailability(false)
                    return
                }
                if (examStartMins >= closeMins) {
                    toast.error(`Exam cannot start at or after closing time (${examTimings.closingTime})`)
                    setCheckingAvailability(false)
                    return
                }
                if (examEndMins > closeMins) {
                    toast.error(`Exam ends at ${endTime}, which is after closing time (${examTimings.closingTime})`)
                    setCheckingAvailability(false)
                    return
                }
            }

            // Fetch all exams on this date
            const res = await fetch(`/api/exams?instituteId=${exam.instituteId?._id || exam.instituteId}&date=${date}`)
            const examsOnDate = await res.json()

            // Get buffer time from institute settings (default 30 minutes for cooldown/cleanup)
            const bufferMinutes = institute.examTimings?.breakBetweenSections || 30

            // Find busy systems
            const busy = new Set<string>()
            examsOnDate.forEach((ex: any) => {
                // Skip current exam
                if (ex._id === examId) return

                if (ex.status === 'Cancelled' || ex.status === 'Completed') return

                const exStart = getMinutes(ex.startTime)
                let exEnd = getMinutes(ex.endTime)
                if (!exEnd || exEnd <= exStart) exEnd = exStart + (ex.duration || 60)

                // Add buffer time to exam end for system cooldown/cleanup
                const exReservedEnd = exEnd + bufferMinutes
                const currentReservedEnd = examEndMins + bufferMinutes

                // Check for overlap including buffer: (StartA < ReservedEndB) && (ReservedEndA > StartB)
                if (examStartMins < exReservedEnd && currentReservedEnd > exStart) {
                    ex.systemAssignments?.forEach((sa: any) => {
                        if (sa.systemName) busy.add(sa.systemName)
                    })
                }
            })

            setBusySystems(busy)

            // Filter available systems
            const hardwareAvailable = allSystems.filter((s: any) => s.status === 'Available' || s.status === 'Active')
            const available = hardwareAvailable.filter((s: any) => !busy.has(s.name))

            setAvailableSystems(available)

            toast.success(`Found ${available.length} available systems (${allSystems.length - hardwareAvailable.length} offline/maintenance, ${hardwareAvailable.length - available.length} busy)`)
        } catch (error: any) {
            console.error('Availability check error:', error)
            toast.error(error.message || 'Failed to check system availability')
        } finally {
            setCheckingAvailability(false)
        }
    }

    const handleAutoAllocate = () => {
        if (availableSystems.length < studentAssignments.length) {
            toast.error(`Not enough systems! Need ${studentAssignments.length}, but only ${availableSystems.length} available`)
            return
        }

        const updated = studentAssignments.map((assignment, index) => ({
            ...assignment,
            systemName: availableSystems[index]?.name || assignment.systemName
        }))

        setStudentAssignments(updated)
        toast.success('Students auto-allocated to systems')
    }

    const handleManualAssignment = (studentId: string, systemName: string) => {
        const updated = studentAssignments.map(assignment =>
            assignment.studentId._id === studentId || assignment.studentId === studentId
                ? { ...assignment, systemName }
                : assignment
        )
        setStudentAssignments(updated)
    }

    const handleSave = async () => {
        // Validation
        if (!date || !startTime) {
            toast.error('Please select date and time')
            return
        }

        const unassigned = studentAssignments.filter(sa => !sa.systemName)
        if (unassigned.length > 0) {
            toast.error(`${unassigned.length} student(s) not assigned to any system`)
            return
        }

        // Check for duplicate system assignments
        const systemCounts = new Map<string, number>()
        studentAssignments.forEach(sa => {
            const count = systemCounts.get(sa.systemName) || 0
            systemCounts.set(sa.systemName, count + 1)
        })

        const duplicates = Array.from(systemCounts.entries()).filter(([_, count]) => count > 1)
        if (duplicates.length > 0) {
            toast.error(`System ${duplicates[0][0]} is assigned to multiple students!`)
            return
        }

        setSaving(true)
        try {
            const examDateTime = new Date(`${date}T${startTime}`)
            const duration = exam.duration || 60
            const endDateTime = new Date(examDateTime.getTime() + duration * 60000)
            const endTime = endDateTime.toTimeString().slice(0, 5)

            const res = await fetch(`/api/exams/${examId}/update-schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: examDateTime,
                    startTime,
                    endTime,
                    systemAssignments: studentAssignments.map(sa => ({
                        studentId: sa.studentId._id || sa.studentId,
                        systemName: sa.systemName,
                        attended: sa.attended || false
                    }))
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to update exam')
            }

            toast.success('Exam updated successfully!')
            router.push('/super-admin/exams')
        } catch (error: any) {
            toast.error(error.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
                <Loader />
            </div>
        )
    }

    if (!exam) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Exam not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <SectionHeader
                        title="Edit Exam Schedule"
                        subtitle={`${exam.title} - ${exam.courseId?.name || 'Course'}`}
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Exam Info & Time Settings */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Schedule Settings
                        </CardTitle>
                        <CardDescription>Update exam date and time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Status</Label>
                            <Badge variant={exam.status === 'Active' ? 'default' : 'secondary'}>
                                {exam.status}
                            </Badge>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="date">Exam Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time">Start Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {exam.duration} minutes
                            </div>
                        </div>

                        {institute?.examTimings && (
                            <div className="space-y-2">
                                <Label>Institute Hours</Label>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                        <Clock className="w-3 h-3" />
                                        <span className="font-medium">
                                            {institute.examTimings.openingTime} - {institute.examTimings.closingTime}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                                        Exams must be within these hours
                                    </p>
                                </div>
                            </div>
                        )}

                        <Separator />

                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={checkSystemAvailability}
                            disabled={!date || !startTime || checkingAvailability}
                        >
                            {checkingAvailability ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Check Availability
                                </>
                            )}
                        </Button>

                        <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Systems:</span>
                                <span className="font-medium">{allSystems.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Available:</span>
                                <span className="font-medium text-green-600">{availableSystems.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Busy:</span>
                                <span className="font-medium text-orange-600">{busySystems.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Students:</span>
                                <span className="font-medium">{studentAssignments.length}</span>
                            </div>
                        </div>

                        {availableSystems.length < studentAssignments.length && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    Not enough systems available! Need {studentAssignments.length}, but only {availableSystems.length} free.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column - Student-System Assignments */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    System Assignments
                                </CardTitle>
                                <CardDescription>
                                    Assign each student to an available system
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleAutoAllocate}
                                disabled={availableSystems.length < studentAssignments.length}
                                variant="outline"
                                size="sm"
                            >
                                <Monitor className="w-4 h-4 mr-2" />
                                Auto Allocate
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Assigned System</TableHead>
                                        <TableHead className="w-[100px] text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No students assigned to this exam
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        studentAssignments.map((assignment, index) => {
                                            const studentId = assignment.studentId._id || assignment.studentId
                                            const currentSystem = assignment.systemName
                                            const isSystemBusy = currentSystem && busySystems.has(currentSystem)

                                            return (
                                                <TableRow key={studentId}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {assignment.studentId.name?.charAt(0) || 'S'}
                                                            </div>
                                                            <span className="font-medium">{assignment.studentId.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {assignment.studentId.rollNo || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={currentSystem || ''}
                                                            onValueChange={(value) => handleManualAssignment(studentId, value)}
                                                        >
                                                            <SelectTrigger className={isSystemBusy ? 'border-orange-500' : ''}>
                                                                <SelectValue placeholder="Select system..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableSystems.map((system) => (
                                                                    <SelectItem key={system.name} value={system.name}>
                                                                        {system.name}
                                                                    </SelectItem>
                                                                ))}
                                                                {currentSystem && !availableSystems.find(s => s.name === currentSystem) && (
                                                                    <SelectItem value={currentSystem} disabled>
                                                                        {currentSystem} (Busy at this time)
                                                                    </SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {currentSystem ? (
                                                            isSystemBusy ? (
                                                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                                    Conflict
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    OK
                                                                </Badge>
                                                            )
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">
                                                                Not Set
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Make sure all students are assigned to available systems before saving
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
