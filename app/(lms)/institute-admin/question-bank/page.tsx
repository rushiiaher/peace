'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { QBCourseCard, QuestionBankCard } from "@/components/lms/qb-cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Loader from "@/components/ui/loader"
import { toast } from "sonner"
import { FileQuestion, HelpCircle, BookOpen, ChevronLeft, Search } from "lucide-react"

export default function InstituteQuestionBankPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [qbs, setQbs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<'courses' | 'qbs'>('courses')
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          setLoading(false)
          return
        }
        const user = JSON.parse(userStr)

        const qbPromise = fetch('/api/question-banks').then(res => res.json())

        let coursesPromise = Promise.resolve([])
        if (user.instituteId) {
          coursesPromise = fetch(`/api/institutes/${user.instituteId}`)
            .then(res => res.json())
            .then(data => data.courses?.map((c: any) => c.courseId) || [])
        }

        const [qbsData, coursesData] = await Promise.all([qbPromise, coursesPromise])

        setQbs(Array.isArray(qbsData) ? qbsData : [])
        setCourses(Array.isArray(coursesData) ? coursesData : [])
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  // Filter logic
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

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  // Calculate stats based on available courses only
  const availableQBs = qbs.filter((qb: any) => courses.some((c: any) => c._id === qb.courseId?._id))
  // const totalQBs = availableQBs.length
  // const totalQuestions = availableQBs.reduce((sum: number, qb: any) => sum + (qb.questions?.length || 0), 0)
  // const totalCourses = courses.length

  return (
    <div className="space-y-6">
      <SectionHeader
        title={view === 'courses' ? "Question Bank" : `${selectedCourse?.name} Question Banks`}
        subtitle={view === 'courses' ? "Select a course to view its question banks" : "Review questions available in this course"}
      />

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
                role="institute-admin"
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
