'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function ExamReviewPage() {
    const params = useParams()
    const router = useRouter()
    const resultId = params.id as string

    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!resultId) return
        fetch(`/api/exam-results/${resultId}`)
            .then(res => res.json())
            .then(data => {
                setResult(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [resultId])

    if (loading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
    if (!result) return <div className="p-6 text-center">Result not found.</div>

    const questions = result.examId?.questions || []
    const studentAnswers = result.answers || []

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <SectionHeader
                    title="Review Answers"
                    subtitle={`${result.examId?.title} - ${result.examId?.courseId?.name}`}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/30 border-blue-100">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-blue-600 font-medium">Final Score</p>
                        <p className="text-2xl font-bold text-blue-700">{result.score} / {result.totalMarks}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/30 border-green-100">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-green-600 font-medium">Percentage</p>
                        <p className="text-2xl font-bold text-green-700">{result.percentage?.toFixed(1)}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50/30 border-purple-100">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-purple-600 font-medium">Attempted</p>
                        <p className="text-2xl font-bold text-purple-700">{studentAnswers.filter((a: any) => a !== null).length} / {questions.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/30 border-orange-100">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-orange-600 font-medium">Status</p>
                        <p className="text-2xl font-bold text-orange-700">{result.percentage >= 40 ? 'PASSED' : 'FAILED'}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground border">
                    <Info className="w-4 h-4" />
                    <span>Review your selections against the correct answers below.</span>
                </div>

                {questions.map((q: any, idx: number) => {
                    const studentChoice = studentAnswers[idx]
                    const isCorrect = studentChoice === q.correctAnswer
                    const isUnattempted = studentChoice === null || studentChoice === undefined

                    return (
                        <Card key={idx} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : isUnattempted ? 'border-l-gray-300' : 'border-l-red-500'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="font-medium text-lg">
                                        <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                                        {q.question}
                                    </div>
                                    {isCorrect ? (
                                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Correct
                                        </Badge>
                                    ) : isUnattempted ? (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unattempted
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2 space-y-3">
                                <div className="grid gap-2">
                                    {q.options.map((option: string, optIdx: number) => {
                                        const isSelected = studentChoice === optIdx
                                        const isCorrectOption = q.correctAnswer === optIdx

                                        let bgColor = "hover:bg-muted/50"
                                        let borderColor = "border-muted"
                                        let textColor = "text-foreground"

                                        if (isCorrectOption) {
                                            bgColor = "bg-green-50"
                                            borderColor = "border-green-200"
                                            textColor = "text-green-800"
                                        } else if (isSelected && !isCorrect) {
                                            bgColor = "bg-red-50"
                                            borderColor = "border-red-200"
                                            textColor = "text-red-800"
                                        }

                                        return (
                                            <div
                                                key={optIdx}
                                                className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${bgColor} ${borderColor} ${textColor}`}
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${isCorrectOption ? 'bg-green-500 text-white border-green-500' : isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-muted border-muted-foreground/20'}`}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    <span>{option}</span>
                                                </div>
                                                {isCorrectOption && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-green-200 px-1.5 py-0.5 rounded text-green-800">Correct Answer</span>
                                                )}
                                                {isSelected && !isCorrect && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-200 px-1.5 py-0.5 rounded text-red-800">Your Choice</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
