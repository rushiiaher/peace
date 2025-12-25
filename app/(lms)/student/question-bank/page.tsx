'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FileQuestion, HelpCircle, ChevronLeft, Search } from "lucide-react"
import { QBCourseCard, QuestionBankCard } from "@/components/lms/qb-cards"

export default function StudentQuestionBankPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [qbs, setQbs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  const [view, setView] = useState<'courses' | 'qbs'>('courses')
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (!studentId) return

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/question-banks`)
        const data = await res.json()
        const allQbs = Array.isArray(data) ? data : []
        setQbs(allQbs)

        // Extract unique courses from QBs
        const uniqueCoursesMap = new Map()
        allQbs.forEach((qb: any) => {
          if (qb.courseId && !uniqueCoursesMap.has(qb.courseId._id)) {
            uniqueCoursesMap.set(qb.courseId._id, qb.courseId)
          }
        })
        setCourses(Array.from(uniqueCoursesMap.values()))
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    fetchData()
  }, [studentId])

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course)
    setSearchQuery('')
    setView('qbs')
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
    setSearchQuery('')
    setView('courses')
  }

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const filteredQBs = selectedCourse
    ? qbs.filter(qb =>
      qb.courseId?._id === selectedCourse._id &&
      qb.topic.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    : []

  if (loading) return <div className="space-y-6"><SectionHeader title="Question Bank" subtitle="Practice questions by course and topic" /><Skeleton className="h-32 w-full" /></div>

  const totalQBs = qbs.length
  const totalQuestions = qbs.reduce((sum: number, qb: any) => sum + (qb.questions?.length || 0), 0)

  return (
    <div className="space-y-6">
      <SectionHeader title="Question Bank" subtitle="Practice questions by course and topic" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question Banks</p>
                <p className="text-3xl font-bold mt-2">{totalQBs}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileQuestion className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-3xl font-bold mt-2">{totalQuestions}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur py-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center transition-all">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {view === 'qbs' && (
            <Button variant="ghost" size="icon" onClick={handleBackToCourses} className="shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={view === 'courses' ? "Search courses..." : "Search question banks..."}
              className="pl-9 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {view === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No courses found matching "{searchQuery}"
            </div>
          ) : (
            filteredCourses.map(course => (
              <QBCourseCard key={course._id} course={course} onClick={() => handleCourseClick(course)} />
            ))
          )}
        </div>
      )}

      {view === 'qbs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredQBs.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileQuestion className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Question Banks Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                No question banks available for this course.
              </p>
            </div>
          ) : (
            filteredQBs.map(qb => (
              <QuestionBankCard
                key={qb._id}
                qb={qb}
                role="student"
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
