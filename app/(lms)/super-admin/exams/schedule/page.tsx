'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, BookOpen, Building2, HelpCircle } from "lucide-react"
import Link from 'next/link'

export default function ScheduleExamPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [courses, setCourses] = useState([])
    const [institutes, setInstitutes] = useState([])
    const [qbs, setQbs] = useState([])

    const [selectedCourseId, setSelectedCourseId] = useState('')
    const [selectedQBs, setSelectedQBs] = useState<string[]>([])

    // Duration calculation
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        fetchCourses()
        fetchInstitutes()
        fetchQBs()
    }, [])

    useEffect(() => {
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(':').map(Number)
            const [eh, em] = endTime.split(':').map(Number)
            const diff = (eh * 60 + em) - (sh * 60 + sm)
            setDuration(diff > 0 ? diff : 0)
        }
    }, [startTime, endTime])

    const fetchCourses = async () => {
        const res = await fetch('/api/courses')
        setCourses(await res.json())
    }

    const fetchInstitutes = async () => {
        const res = await fetch('/api/institutes')
        setInstitutes(await res.json())
    }

    const fetchQBs = async () => {
        const res = await fetch('/api/question-banks')
        setQbs(await res.json())
    }

    const handleCreateFinalExam = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        if (selectedQBs.length === 0) {
            toast.error('Please select at least one question bank')
            setLoading(false)
            return
        }

        const data = {
            courseId: formData.get('courseId'),
            instituteId: formData.get('instituteId'),
            title: formData.get('title'),
            date: formData.get('date'),
            startTime: formData.get('startTime'),
            totalQuestions: Number(formData.get('totalQuestions')),
            selectedQBIds: selectedQBs,
            forceNextDay: false,
            forceNextSection: false
        }

        try {
            const res = await fetch('/api/exams/allocate-systems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const result = await res.json()

            if (res.ok) {
                toast.success(result.message || 'Exam scheduled successfully')
                router.push('/super-admin/exams')
            } else {
                // Handle constraint warnings with options
                if (result.error && (result.error.includes('next day') || result.error.includes('next section'))) {
                    // Ideally we'd show a dialog here, but for now we'll just show the error
                    // Implementing complex retry logic in a basic form might be overkill for this iteration
                    // unless we add a confirmation modal. 
                    // For this version, let's treat it as a hard error but hint at the user.
                    toast.error(result.error)
                } else {
                    toast.error(result.error || 'Failed to schedule exam')
                }
            }
        } catch (error) {
            toast.error('Failed to schedule exam')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/exams">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Schedule Final Exam"
                    subtitle="Configure exam details, timing, and question sources"
                />
            </div>

            <form onSubmit={handleCreateFinalExam} className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-8 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <CardTitle>Context & Title</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="courseId">Course</Label>
                                <Select name="courseId" required onValueChange={setSelectedCourseId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instituteId">Institute</Label>
                                <Select name="instituteId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select institute" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {institutes.map((i: any) => <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="title">Exam Title</Label>
                                <Input id="title" name="title" placeholder="e.g. Final Semester Exam" required />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-purple-600" />
                                <CardTitle>Question Configuration</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Select Question Banks</Label>
                                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-4 bg-muted/20">
                                    {selectedCourseId ? (
                                        qbs.filter((qb: any) => qb.courseId?._id === selectedCourseId).length > 0 ? (
                                            qbs.filter((qb: any) => qb.courseId?._id === selectedCourseId).map((qb: any) => (
                                                <div key={qb._id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        id={`qb-${qb._id}`}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={selectedQBs.includes(qb._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedQBs([...selectedQBs, qb._id])
                                                            else setSelectedQBs(selectedQBs.filter(id => id !== qb._id))
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <label htmlFor={`qb-${qb._id}`} className="text-sm font-medium cursor-pointer block">
                                                            {qb.topic}
                                                        </label>
                                                        <p className="text-xs text-muted-foreground">{qb.questions?.length || 0} questions available</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <p className="text-sm text-muted-foreground text-center py-4">No question banks found for this course.</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Please select a course first.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalQuestions">Total Questions to Generate</Label>
                                <Input
                                    id="totalQuestions"
                                    name="totalQuestions"
                                    type="number"
                                    min="1"
                                    placeholder="Enter total count"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Questions will be randomly selected from the chosen specific question banks.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <CardTitle>Schedule</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start</Label>
                                    <Input
                                        id="startTime"
                                        name="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End</Label>
                                    <Input
                                        id="endTime"
                                        name="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                    <Label>Duration</Label>
                                    <span className="font-mono font-bold text-lg">{duration}m</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? 'Scheduling...' : 'Schedule Exam'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground px-4">
                        This will allocate systems and generate admit cards for eligible students.
                    </p>
                </div>
            </form>
        </div>
    )
}
