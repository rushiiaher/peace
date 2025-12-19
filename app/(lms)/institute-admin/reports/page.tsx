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
import { BarChart3, Users, FileText, TrendingUp, Search, X } from "lucide-react"
import Loader from "@/components/ui/loader"

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

  // Fetch batches when course selected
  useEffect(() => {
    if (selectedCourse === 'all' || !instituteId) {
      setBatches([])
      return
    }
    const fetchBatches = async () => {
      try {
        // Assuming we can fetch batches by course
        // If explicit API exists: /api/batches?courseId=...
        // Or fetch all and filter. Going with fetch all for institute to support "All Courses" logic better if needed, 
        // but for specific course selection let's try strict filtering.
        // Actually, based on previous steps, let's fetch all batches for institute if possible or filter
        const res = await fetch(`/api/batches?courseId=${selectedCourse}`)
        const data = await res.json()
        setBatches(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching batches", error)
      }
    }
    fetchBatches()
  }, [selectedCourse])


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

      <div className="space-y-4">
        {Object.keys(activeTab === 'dpp' ? dppByStudent : finalByStudent).length === 0 ? (
          <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No results match your filters.</p>
            <div className="mt-2">
              <button onClick={() => { setSearchTerm(''); setSelectedCourse('all'); setSelectedBatch('all') }} className="text-primary hover:underline text-sm font-medium">Clear all filters</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(activeTab === 'dpp' ? dppByStudent : finalByStudent).map((data: any) => {
              const avg = (data.results.reduce((sum: number, r: any) => sum + r.percentage, 0) / data.results.length).toFixed(1)
              const avgNum = parseFloat(avg)
              return (
                <Card key={data.student._id} className="hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {data.student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <CardTitle className="text-base">{data.student.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">Roll No: {data.student.rollNo}</p>
                        </div>
                      </div>
                      <Badge variant={avgNum >= 75 ? 'default' : avgNum >= 50 ? 'secondary' : 'destructive'} className="ml-2">
                        {avg}% Avg
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Overall Performance</span>
                        <span className="font-medium">{avg}%</span>
                      </div>
                      <Progress
                        value={avgNum}
                        className="h-1.5"
                        indicatorClassName={avgNum >= 75 ? 'bg-green-500' : avgNum >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                      />
                    </div>

                    <div className="space-y-2 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Exams</p>
                      {data.results.slice(0, 3).map((r: any) => (
                        <div key={r._id} className="flex items-center justify-between text-xs p-2.5 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                          <span className="font-medium truncate max-w-[120px]" title={r.examId?.title}>{r.examId?.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.score}/{r.totalMarks}</span>
                            <span className={`font-bold ${r.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                              {r.percentage?.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {data.results.length > 3 && (
                        <p className="text-center text-xs text-muted-foreground pt-1">+{data.results.length - 3} more exams</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
