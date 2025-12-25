'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, FileText, TrendingUp, Search, X, Download } from "lucide-react"
import Loader from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ReportsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dpp")

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedBatch, setSelectedBatch] = useState("all")
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) fetchData()
  }, [instituteId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resultsRes, coursesRes] = await Promise.all([
        fetch(`/api/institutes/${instituteId}/exam-results`),
        fetch(`/api/courses?instituteId=${instituteId}`) // Assuming API supports this or fetches all
      ])

      const resultsData = await resultsRes.json()
      const coursesData = await coursesRes.json()

      setResults(Array.isArray(resultsData) ? resultsData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch data", error)
      setLoading(false)
    }
  }

  // Fetch batches based on selection
  useEffect(() => {
    if (!instituteId) return

    const fetchBatches = async () => {
      try {
        let url = `/api/batches?instituteId=${instituteId}`
        if (selectedCourse !== 'all') {
          url += `&courseId=${selectedCourse}`
        }
        const res = await fetch(url)
        const data = await res.json()
        setBatches(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching batches", error)
      }
    }
    fetchBatches()
  }, [instituteId, selectedCourse])


  // FILTERING LOGIC
  const filteredResults = results.filter(r => {
    // 1. Search Term (Name or Roll No)
    if (searchTerm) {
      const studentName = r.studentId?.name?.toLowerCase() || ''
      const rollNo = r.studentId?.rollNo?.toLowerCase() || ''
      const search = searchTerm.toLowerCase()
      if (!studentName.includes(search) && !rollNo.includes(search)) {
        return false
      }
    }

    // 2. Course Filter
    // Result -> Exam -> Course OR Student -> Course? 
    // Usually Result -> ExamId -> CourseId
    if (selectedCourse !== 'all') {
      const examCourseId = r.examId?.courseId?._id || r.examId?.courseId
      if (examCourseId !== selectedCourse) return false
    }

    // 3. Batch Filter
    // Need to check if student is in the selected batch
    if (selectedBatch !== 'all') {
      const currentBatch = batches.find(b => b._id === selectedBatch)
      if (currentBatch && currentBatch.students) {
        const studentId = r.studentId?._id || r.studentId
        const isInBatch = currentBatch.students.some((s: any) => (s._id || s) === studentId)
        if (!isInBatch) return false
      }
    }

    return true
  })


  const dppResults = filteredResults.filter(r => r.examId?.type === 'DPP')
  const finalResults = filteredResults.filter(r => r.examId?.type === 'Final')

  const groupByStudent = (results: any[]) => {
    return results.reduce((acc: any, r: any) => {
      const studentId = r.studentId?._id
      if (!acc[studentId]) {
        acc[studentId] = { student: r.studentId, results: [] }
      }
      acc[studentId].results.push(r)
      return acc
    }, {})
  }

  const dppByStudent = groupByStudent(dppResults)
  const finalByStudent = groupByStudent(finalResults)

  const totalStudents = Object.keys(groupByStudent(filteredResults)).length
  const avgPerformance = filteredResults.length > 0 ? (filteredResults.reduce((sum: number, r: any) => sum + r.percentage, 0) / filteredResults.length).toFixed(1) : '0'

  const downloadBatchCSV = (batchName: string, data: any[]) => {
    const headers = ["Student Name", "Roll No", "Email", "Exams Taken", "Avg Score", "Performance"]
    const rows = data.map(item => {
      const avg = (item.results.reduce((sum: any, r: any) => sum + r.percentage, 0) / item.results.length).toFixed(1)
      const avgNum = parseFloat(avg)
      const performance = avgNum >= 75 ? 'Excellent' : avgNum >= 50 ? 'Average' : 'Poor'
      return [
        item.student.name,
        item.student.rollNo || 'N/A',
        item.student.email,
        item.results.length,
        `${avg}%`,
        performance
      ].map(e => `"${e}"`).join(",") // Quote fields
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${batchName}_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Analytics" subtitle="Comprehensive view of student performance." />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-xl border border-dashed">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name or roll no..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCourse} onValueChange={(val) => { setSelectedCourse(val); setSelectedBatch('all') }}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={selectedCourse === 'all'}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {(searchTerm || selectedCourse !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setSelectedCourse('all'); setSelectedBatch('all') }} className="p-2 hover:bg-muted rounded-full transition-colors" title="Clear Filters">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Results</p>
                <p className="text-2xl font-bold">{filteredResults.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Filtered View</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">Matching Criteria</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Exams</p>
                <p className="text-2xl font-bold">{filteredResults.length ? new Set(filteredResults.map(r => r.examId?._id)).size : 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique Papers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Avg Score</p>
                <p className="text-2xl font-bold">{avgPerformance}%</p>
                <p className="text-xs text-muted-foreground mt-1">For Selection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-4 flex justify-center">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "dpp", label: "DPP Performance" },
            { id: "final", label: "Final Exam Performance" }
          ]}
        />
      </div>

      <div className="space-y-8">
        {/* If no data globally */}
        {Object.keys(activeTab === 'dpp' ? dppByStudent : finalByStudent).length === 0 ? (
          // ... existing "No results" div ...
          <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No results match your filters.</p>
            <div className="mt-2">
              <button onClick={() => { setSearchTerm(''); setSelectedCourse('all'); setSelectedBatch('all') }} className="text-primary hover:underline text-sm font-medium">Clear all filters</button>
            </div>
          </div>
        ) : (
          // Iterate Batches
          (selectedBatch === 'all' && batches.length > 0 ? batches : batches.filter(b => b._id === selectedBatch)).map(batch => {
            const allStudentData = Object.values(activeTab === 'dpp' ? dppByStudent : finalByStudent)
            // Filter students belonging to this batch
            // batch.students is array of filters.
            // We need to match student IDs.
            const batchData = allStudentData.filter((d: any) =>
              batch.students?.some((s: any) => (s._id || s) === d.student._id)
            )

            if (batchData.length === 0) return null

            return (
              <div key={batch._id} className="space-y-3">
                <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{batch.name}</h3>
                    <Badge variant="secondary" className="ml-2">{batchData.length} Students</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => downloadBatchCSV(batch.name, batchData)}>
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                </div>

                <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                  <Table>
                    {/* ... Same Header ... */}
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[250px] pl-4">Student Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Overall Performance</TableHead>
                        <TableHead className="text-center">Exams Taken</TableHead>
                        <TableHead>Recent Scores</TableHead>
                        <TableHead className="text-right pr-4">Avg Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchData.map((data: any) => {
                        // ... Same Row Logic ...
                        const avg = (data.results.reduce((sum: number, r: any) => sum + r.percentage, 0) / data.results.length).toFixed(1)
                        const avgNum = parseFloat(avg)
                        const recentResults = data.results.slice(0, 3)

                        return (
                          <TableRow key={data.student._id} className="group hover:bg-muted/30 transition-colors">
                            {/* ... Same Cells ... */}
                            <TableCell className="pl-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                  {data.student.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">{data.student.name}</p>
                                  <p className="text-xs text-muted-foreground">{data.student.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground border-muted-foreground/20">
                                {data.student.rollNo || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className={avgNum >= 75 ? "text-green-600 font-medium" : avgNum >= 50 ? "text-yellow-600 font-medium" : "text-red-600 font-medium"}>
                                    {avgNum >= 75 ? 'Excellent' : avgNum >= 50 ? 'Average' : 'Poor'}
                                  </span>
                                  <span className="text-muted-foreground">{avg}%</span>
                                </div>
                                <Progress
                                  value={avgNum}
                                  className="h-1.5"
                                  indicatorClassName={avgNum >= 75 ? 'bg-green-500' : avgNum >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="rounded-full px-2.5">
                                {data.results.length}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap max-w-[250px]">
                                {recentResults.map((r: any) => (
                                  <div key={r._id} className="flex flex-col items-center bg-muted/40 border rounded px-1.5 py-1 min-w-[60px]">
                                    <span className="text-[9px] text-muted-foreground truncate max-w-[60px] pb-0.5" title={r.examId?.title}>{r.examId?.title?.slice(0, 8)}..</span>
                                    <span className="text-[10px] font-medium text-foreground">{r.score}/{r.totalMarks}</span>
                                    <span className={`text-[10px] font-bold ${r.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>{r.percentage?.toFixed(0)}%</span>
                                  </div>
                                ))}
                                {data.results.length > 3 && (
                                  <div className="flex items-center justify-center bg-muted/20 border border-dashed rounded px-1.5 py-1 min-w-[30px] h-[38px] text-[10px] text-muted-foreground">
                                    +{data.results.length - 3}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <span className={`text-lg font-bold ${avgNum >= 75 ? 'text-green-600' : avgNum >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {avg}%
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })
        )}

        {/* Fallback if no batches found but data exists (e.g. students not assigned to any batch?) */}
        {/* This edge case is tricky. If we filter by batch, we only show batch students. If 'all', we iterate batches. 
             If a student is NOT in any batch, they won't show up here. 
             Ideally all students should be in batches. 
             We can add a "Unassigned" section if needed, but for now assuming strict batch assignment based on User requirement "separate out ... basis of batches".
          */}
      </div>
    </div>
  )
}
