'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import Link from 'next/link'

export default function AddQuestionPage() {
    const params = useParams()
    const router = useRouter()
    const [qbName, setQbName] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchQBDetails()
    }, [])

    const fetchQBDetails = async () => {
        try {
            const res = await fetch(`/api/question-banks/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setQbName(data.topic)
            }
        } catch (error) {
            // Silent fail for just the name
        }
    }

    const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const question = {
            question: formData.get('question'),
            options: [
                formData.get('option1'),
                formData.get('option2'),
                formData.get('option3'),
                formData.get('option4')
            ],
            correctAnswer: Number(formData.get('correctAnswer')),
            explanation: formData.get('explanation')
        }

        try {
            const res = await fetch(`/api/question-banks/${params.id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(question)
            })

            if (res.ok) {
                toast.success('Question added successfully')
                // Check which button submitted to decide redirect vs reset
                // For now, let's default to redirect back to list
                router.push(`/super-admin/question-bank/${params.id}`)
            } else {
                toast.error('Failed to add question')
            }
        } catch (error) {
            toast.error('Failed to add question')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/super-admin/question-bank/${params.id}`}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Add Question"
                    subtitle={`Adding to: ${qbName || 'Loading...'}`}
                />
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleAddQuestion} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="question">Question Text</Label>
                            <Textarea
                                id="question"
                                name="question"
                                required
                                rows={3}
                                placeholder="Enter the question..."
                                className="text-base"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="option1">Option A</Label>
                                <Input id="option1" name="option1" required placeholder="Option A" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="option2">Option B</Label>
                                <Input id="option2" name="option2" required placeholder="Option B" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="option3">Option C</Label>
                                <Input id="option3" name="option3" required placeholder="Option C" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="option4">Option D</Label>
                                <Input id="option4" name="option4" required placeholder="Option D" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="correctAnswer">Correct Option</Label>
                            <Select name="correctAnswer" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select correct answer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Option A</SelectItem>
                                    <SelectItem value="1">Option B</SelectItem>
                                    <SelectItem value="2">Option C</SelectItem>
                                    <SelectItem value="3">Option D</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="explanation">Explanation (Optional)</Label>
                            <Textarea
                                id="explanation"
                                name="explanation"
                                rows={3}
                                placeholder="Explain why the answer is correct..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" type="button" asChild>
                                <Link href={`/super-admin/question-bank/${params.id}`}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={loading} className="min-w-[120px]">
                                {loading ? 'Saving...' : 'Save Question'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
