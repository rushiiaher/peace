'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ArrowLeft, Plus, Search, Trash2, Edit, Upload } from "lucide-react"
import Link from 'next/link'
import Loader from "@/components/ui/loader"

export default function ManageQuestionBankPage() {
    const params = useParams()
    const [qb, setQb] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const [uploadExcelOpen, setUploadExcelOpen] = useState(false)
    const [excelFile, setExcelFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

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

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return

        try {
            const res = await fetch(`/api/question-banks/${params.id}/questions`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId })
            })
            if (res.ok) {
                toast.success('Question deleted successfully')
                fetchQuestionBank()
            } else {
                toast.error('Failed to delete question')
            }
        } catch (error) {
            toast.error('Failed to delete question')
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
                        <Link href="/super-admin/question-bank">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <SectionHeader
                        title={qb.topic}
                        subtitle={`${qb.courseId?.name} • ${qb.questions?.length || 0} Questions`}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setUploadExcelOpen(true)}>
                        <Upload className="w-4 h-4" />
                        Upload Excel
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href={`/super-admin/question-bank/${params.id}/add`}>
                            <Plus className="w-4 h-4" />
                            Add Question
                        </Link>
                    </Button>
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
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 w-8 p-0 shrink-0"
                                    onClick={() => handleDeleteQuestion(q._id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
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

            <Dialog open={uploadExcelOpen} onOpenChange={setUploadExcelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Excel - {qb.topic}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Excel File</Label>
                            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button disabled={!excelFile || uploading} onClick={async () => {
                            if (!excelFile) return
                            setUploading(true)
                            const formData = new FormData()
                            formData.append('file', excelFile)
                            try {
                                const parseRes = await fetch('/api/question-banks/parse-excel', { method: 'POST', body: formData })
                                const parseData = await parseRes.json()

                                if (!parseRes.ok) {
                                    toast.error(parseData.error || 'Failed to parse Excel')
                                    setUploading(false)
                                    return
                                }

                                const validQuestions = parseData.rows.filter((r: any) => r.isValid)

                                if (validQuestions.length === 0) {
                                    toast.error('No valid questions found in Excel')
                                    setUploading(false)
                                    return
                                }

                                const importRes = await fetch('/api/question-banks/import-excel', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ questionBankId: params.id, questions: validQuestions })
                                })

                                const importData = await importRes.json()

                                if (importRes.ok) {
                                    toast.success(`${validQuestions.length} questions imported successfully`)
                                    setUploadExcelOpen(false)
                                    setExcelFile(null)
                                    fetchQuestionBank()
                                } else {
                                    toast.error(importData.error || 'Failed to import questions')
                                }
                            } catch (error: any) {
                                toast.error(error.message || 'Failed to import questions')
                            } finally {
                                setUploading(false)
                            }
                        }}>
                            {uploading ? 'Uploading...' : 'Upload & Import'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
