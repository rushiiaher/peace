'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { DataTable } from "@/components/lms/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ExamResults() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exam-results')
      .then(res => res.json())
      .then(data => {
        setResults(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const columns = [
    { key: "sr", label: "Sr." },
    { key: "student", label: "Student" },
    { key: "exam", label: "Exam" },
    { key: "score", label: "Score" },
    { key: "percentage", label: "Percentage" },
    { key: "status", label: "Result" },
    { key: "actions", label: "Actions" },
  ]

  const rows = results.map((result, index) => ({
    sr: index + 1,
    student: result.studentId?.name || 'Unknown',
    exam: result.examId?.title || 'Unknown',
    score: `${result.score} / ${result.totalMarks}`,
    percentage: `${result.percentage?.toFixed(1)}%`,
    status: (
      <Badge variant={result.percentage >= 40 ? 'default' : 'destructive'}>
        {result.percentage >= 40 ? 'Pass' : 'Fail'}
      </Badge>
    ),
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          View Details
        </Button>
      </div>
    ),
  }))

  if (loading) return <div>Loading...</div>

  return (
    <section className="space-y-6">
      <SectionHeader title="Online Exam Result" subtitle="Publish and manage exam results." />
      <DataTable columns={columns} rows={rows} />
    </section>
  )
}
