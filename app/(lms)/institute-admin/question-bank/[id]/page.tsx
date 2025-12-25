'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ArrowLeft, Search } from "lucide-react"
import Link from 'next/link'
import Loader from "@/components/ui/loader"

export default function InstituteQuestionBankDetailsPage() {
    const params = useParams()
    const [qb, setQb] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchQuestionBank()
    }, [])

    const fetchQuestionBank = async () => {
        try {
            const res = await fetch(`/api/question-banks/${params.id}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setQb(data)
        } catch (error) {
            toast.error('Failed to load Question Bank')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
    if (!qb) return <div>Question Bank not found</div>

    const filteredQuestions = qb.questions?.filter((q: any) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/institute-admin/question-bank">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <SectionHeader
                        title={qb.topic}
                        subtitle={`${qb.courseId?.name} • ${qb.questions?.length || 0} Questions`}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {filteredQuestions.map((q: any, i: number) => (
                    <Card key={q._id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3">
                                    <span className="font-bold text-muted-foreground min-w-[24px]">Q{i + 1}.</span>
                                    <p className="font-medium whitespace-pre-wrap">{q.question}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-12 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options?.map((opt: string, j: number) => (
                                    <div
                                        key={j}
                                        className={`p-3 rounded-md text-sm border ${j === q.correctAnswer
                                            ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                                            : 'bg-card border-border'
                                            }`}
                                    >
                                        <span className="font-semibold mr-2">{String.fromCharCode(65 + j)}.</span> {opt}
                                        {j === q.correctAnswer && <span className="ml-2">✓</span>}
                                    </div>
                                ))}
                            </div>
                            {q.explanation && (
                                <div className="mt-2 p-3 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 rounded-md text-sm">
                                    <p className="font-semibold mb-1">Explanation:</p>
                                    <p>{q.explanation}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {filteredQuestions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No questions found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
