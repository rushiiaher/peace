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
import { ArrowLeft, FileCheck, Layers } from "lucide-react"
import Link from 'next/link'

export default function CreateDPPPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [courses, setCourses] = useState([])
    const [qbs, setQbs] = useState([])

    const [selectedCourseId, setSelectedCourseId] = useState('')
    const [selectedQB, setSelectedQB] = useState<any>(null)

    // Form State
    const [dppTitle, setDppTitle] = useState('')
    const [questionCount, setQuestionCount] = useState<number | ''>('')

    useEffect(() => {
        fetchCourses()
    }, [])

    useEffect(() => {
        if (selectedCourseId) {
            fetchQBs(selectedCourseId)
            setSelectedQB(null)
            setDppTitle('')
            setQuestionCount('')
        }
    }, [selectedCourseId])

    const fetchCourses = async () => {
        const res = await fetch('/api/courses')
        setCourses(await res.json())
    }

    const fetchQBs = async (courseId: string) => {
        // excludeWithDPP=true to filter ones that might already have DPPs if logic requires, 
        // but the prompt didn't specify strictness. Keeping generic fetch.
        const res = await fetch(`/api/question-banks?courseId=${courseId}&excludeWithDPP=true`)
        setQbs(await res.json())
    }

    const handleCreateDPP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedCourseId || !selectedQB || !questionCount) {
            toast.error('Please fill all required fields')
            return
        }

        setLoading(true)

        const qbSelections = [{
            qbId: selectedQB._id,
            count: Number(questionCount),
            title: selectedQB.topic
        }]

        // Override logic from original: if user typed a simpler title, we might want to use that?
        // Original logic: title: selectedQBs[0].name. 
        // Here we have a specific title input. 
        // The backend `api/exams/create-dpp` likely iterates `qbSelections`.
        // Let's assume the backend handles the dpp name creation or we should construct it.
        // Actually, looking at previous code, `handleCreateDPP` sent `qbSelections` with `title`.
        // We update that title in `qbSelections`.

        qbSelections[0].title = dppTitle

        try {
            const res = await fetch('/api/exams/create-dpp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: selectedCourseId, qbSelections })
            })

            if (res.ok) {
                toast.success('DPP created successfully')
                router.push('/super-admin/exams')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to create DPP')
            }
        } catch (error) {
            toast.error('Failed to create DPP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/exams">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Create Daily Practice Problem"
                    subtitle="Generate practice sets from question banks"
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-green-600" />
                        <CardTitle>DPP Configuration</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateDPP} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select onValueChange={setSelectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedCourseId && (
                            <div className="space-y-2">
                                <Label>Source Question Bank</Label>
                                <Select onValueChange={(val) => {
                                    const qb: any = qbs.find((q: any) => q._id === val)
                                    setSelectedQB(qb)
                                    if (qb) setDppTitle(qb.topic) // Default title to QB topic
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select question bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {qbs.length > 0 ? (
                                            qbs.map((qb: any) => (
                                                <SelectItem key={qb._id} value={qb._id}>
                                                    {qb.topic} ({qb.questions?.length || 0} questions)
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No unused QBs found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Only shows Question Banks not yet used for DPPs.</p>
                            </div>
                        )}

                        {selectedQB && (
                            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>DPP Title</Label>
                                    <Input
                                        value={dppTitle}
                                        onChange={(e) => setDppTitle(e.target.value)}
                                        placeholder="e.g. Thermodynamics Practice 1"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Question Count</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="1"
                                            max={selectedQB.questions?.length || 0}
                                            value={questionCount}
                                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                                            placeholder="Max"
                                            required
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                                            / {selectedQB.questions?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/super-admin/exams">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={loading || !selectedQB}>
                                {loading ? 'Creating...' : 'Generate DPP'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
