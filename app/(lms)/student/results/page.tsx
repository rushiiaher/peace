'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, TrendingUp, FileText, Clock, Calendar } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dpp")

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (!studentId) return
    fetch(`/api/students/${studentId}/results`)
      .then(res => res.json())
      .then(data => {
        setResults(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [studentId])

  const dppResults = results.filter(r => r.examId?.type === 'DPP')
  const finalResults = results.filter(r => r.examId?.type === 'Final')
  const avgDPP = dppResults.length ? (dppResults.reduce((sum, r) => sum + r.percentage, 0) / dppResults.length).toFixed(1) : 0
  const avgFinal = finalResults.length ? (finalResults.reduce((sum, r) => sum + r.percentage, 0) / finalResults.length).toFixed(1) : 0

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Results" subtitle="Displays your academic achievements and performance records." />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">DPP Average</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold">{avgDPP}%</p>
                  <p className="text-xs text-muted-foreground">{dppResults.length} DPPs attempted</p>
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Final Exam Average</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold">{avgFinal}%</p>
                  <p className="text-xs text-muted-foreground">{finalResults.length} exams completed</p>
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-6">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "dpp", label: "DPP Results", count: dppResults.length },
            { id: "final", label: "Final Exam Results", count: finalResults.length }
          ]}
        />
      </div>

      {activeTab === 'dpp' && (
        <div className="space-y-3">
          {dppResults.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No DPP results yet</CardContent></Card>
          ) : (
            dppResults.map((result) => (
              <Card key={result._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{result.examId?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{result.examId?.courseId?.name}</p>
                      </div>
                    </div>
                    <Badge variant={result.percentage >= 40 ? 'default' : 'destructive'}>
                      {result.percentage?.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{result.score} / {result.totalMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Time Taken</p>
                        <p className="font-medium">{Math.floor(result.timeTaken / 60)} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(result.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'final' && (
        <div className="space-y-3">
          {finalResults.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No final exam results yet</CardContent></Card>
          ) : (
            finalResults.map((result) => (
              <Card key={result._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{result.examId?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{result.examId?.courseId?.name}</p>
                      </div>
                    </div>
                    <Badge variant={result.percentage >= 40 ? 'default' : 'destructive'}>
                      {result.percentage?.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{result.score} / {result.totalMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Time Taken</p>
                        <p className="font-medium">{Math.floor(result.timeTaken / 60)} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(result.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
