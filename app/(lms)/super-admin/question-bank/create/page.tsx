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
import { ArrowLeft, BookOpen, FileQuestion, GraduationCap } from "lucide-react"
import Link from 'next/link'

export default function CreateQuestionBankPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [courses, setCourses] = useState([])

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses')
            const data = await res.json()
            setCourses(data)
        } catch (error) {
            toast.error('Failed to fetch courses')
        }
    }

    const handleCreateQB = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        // Validate
        const courseId = formData.get('courseId')
        const topic = formData.get('topic')

        if (!courseId || !topic) {
            toast.error('Please fill all required fields')
            setLoading(false)
            return
        }

        const data = {
            courseId,
            topic,
            questions: []
        }

        try {
            const res = await fetch('/api/question-banks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Question Bank created successfully')
                router.push('/super-admin/question-bank')
            } else {
                const result = await res.json()
                toast.error(result.error || 'Failed to create question bank')
            }
        } catch (error) {
            toast.error('Failed to create question bank')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/question-bank">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Create Question Bank"
                    subtitle="Add a new topic to organize questions"
                />
            </div>

            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileQuestion className="w-5 h-5 text-blue-600" />
                        <CardTitle>Topic Details</CardTitle>
                    </div>
                    <CardDescription>
                        Define the subject and topic for this collection of questions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateQB} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="courseId">Course</Label>
                            <Select name="courseId" required>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course: any) => (
                                        <SelectItem key={course._id} value={course._id}>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                <span>{course.name}</span>
                                                <span className="text-muted-foreground text-xs ml-auto">({course.code})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic Name</Label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="topic"
                                    name="topic"
                                    required
                                    placeholder="e.g. Thermodynamics, Linear Algebra, React Hooks"
                                    className="pl-9 h-11"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">This name will be used when filtering questions for exams.</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" asChild size="lg">
                                <Link href="/super-admin/question-bank">Cancel</Link>
                            </Button>
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Question Bank'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
                <p>After creating the bank, you can add questions manually or upload via Excel.</p>
            </div>
        </div>
    )
}
