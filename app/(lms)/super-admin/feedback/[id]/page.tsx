'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, BookOpen, Building2 } from "lucide-react"
import Link from 'next/link'
import Loader from "@/components/ui/loader"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function FeedbackAnalyticsPage() {
    const params = useParams()
    const [form, setForm] = useState<any>(null)
    const [responses, setResponses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [formRes, responsesRes] = await Promise.all([
                fetch(`/api/feedback-forms/${params.id}`),
                fetch(`/api/feedback-responses?formId=${params.id}`)
            ])

            if (formRes.ok) setForm(await formRes.json())
            if (responsesRes.ok) setResponses(await responsesRes.json())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
    if (!form) return <div>Form not found</div>

    const processQuestionData = (questionId: string, type: string, options: string[]) => {
        if (type === 'text') return null

        const counts: Record<string, number> = {}

        // Initialize with 0 for all options if choice
        if (type === 'choice') {
            options?.forEach(opt => counts[opt] = 0)
        }

        responses.forEach(r => {
            const answer = r.responses.find((ans: any) => ans.questionId === questionId)?.answer
            if (answer) {
                counts[answer] = (counts[answer] || 0) + 1
            }
        })

        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/feedback">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <SectionHeader
                        title={form.title}
                        subtitle={`${form.instituteId?.name} • ${form.courseId?.name}`}
                    />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{responses.length}</p>
                    <p className="text-xs text-muted-foreground">Total Responses</p>
                </div>
            </div>

            <div className="grid gap-6">
                {form.questions.map((q: any, idx: number) => {
                    const data = processQuestionData(q._id, q.type, q.options)

                    return (
                        <Card key={q._id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-muted-foreground">Q{idx + 1}.</span>
                                        <div>
                                            <CardTitle className="text-base">{q.question}</CardTitle>
                                            <Badge variant="outline" className="mt-1 text-xs">{q.type}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {q.type === 'text' ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {responses.slice(0, 20).map((r, i) => {
                                            const ans = r.responses.find((ans: any) => ans.questionId === q._id)?.answer
                                            if (!ans) return null
                                            return (
                                                <div key={i} className="p-3 bg-muted/30 rounded text-sm mb-2">
                                                    <p>{ans}</p>
                                                </div>
                                            )
                                        })}
                                        {responses.length === 0 && <p className="text-sm text-muted-foreground italic">No responses yet.</p>}
                                    </div>
                                ) : (
                                    <div className="h-[300px] w-full mt-4">
                                        {data && data.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                {q.type === 'rating' ? (
                                                    <BarChart data={data}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                                            {data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                ) : (
                                                    <PieChart>
                                                        <Pie
                                                            data={data}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={100}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                )}
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                No data available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Respondent List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-3 p-3 font-medium bg-muted/50 border-b text-sm">
                            <div>Student Name</div>
                            <div>Submitted At</div>
                            <div>Actions</div>
                        </div>
                        {responses.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No responses found</div>
                        ) : (
                            responses.map((r, i) => (
                                <div key={i} className="grid grid-cols-3 p-3 text-sm border-b last:border-0 hover:bg-muted/10">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{r.studentId?.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{r.studentId?.rollNo}</span>
                                    </div>
                                    <div className="flex items-center">
                                        {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div>
                                        {/* Placeholder for individual view if needed */}
                                        <Badge variant="secondary">Viewed</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
