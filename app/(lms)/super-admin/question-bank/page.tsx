'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { FileQuestion, Plus, Search, ChevronLeft } from "lucide-react"
import Link from 'next/link'
import { QBCourseCard, QuestionBankCard } from "@/components/lms/qb-cards"

export default function QuestionBankPage() {
  const [view, setView] = useState<'courses' | 'qbs'>('courses')
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  const [courses, setCourses] = useState<any[]>([])
  const [qbs, setQbs] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initial Data Fetch (Courses)
  useEffect(() => {
    fetchCourses()
  }, [])

  // Fetch QBs when course is selected or search changes (only in QB view)
  useEffect(() => {
    if (view === 'qbs' && selectedCourse) {
      fetchQBs()
    }
  }, [debouncedSearch, selectedCourse, view])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchQBs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('courseId', selectedCourse._id)
      if (debouncedSearch) params.append('search', debouncedSearch)

      const res = await fetch(`/api/question-banks?${params.toString()}`)
      const data = await res.json()
      setQbs(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch question banks')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQB = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!confirm('Are you sure you want to delete this question bank?')) return

    try {
      const res = await fetch(`/api/question-banks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Question bank deleted successfully')
        fetchQBs()
      }
    } catch (error) {
      toast.error('Failed to delete question bank')
    }
  }

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course)
    setSearchQuery('') // Clear search when entering QB view
    setView('qbs')
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
    setSearchQuery('') // Clear search when going back
    setView('courses')
    setQbs([])
  }

  // Filter courses client-side for smoother experience
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <SectionHeader
        title={view === 'courses' ? "Question Bank Management" : `${selectedCourse?.name} Question Banks`}
        subtitle={view === 'courses' ? "Select a course to manage its question banks" : "Manage and organize questions for this course"}
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

        <Button asChild className="gap-2 shrink-0 shadow-lg shadow-primary/20">
          <Link href={`/super-admin/question-bank/create${selectedCourse ? `?courseId=${selectedCourse._id}` : ''}`}>
            <Plus className="w-4 h-4" />
            Create Question Bank
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-muted rounded-xl"></div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* COURSE VIEW */}
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

          {/* QB VIEW */}
          {view === 'qbs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {qbs.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileQuestion className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No Question Banks Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    {searchQuery ? `No matches for "${searchQuery}"` : "This course doesn't have any question banks yet."}
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/super-admin/question-bank/create?courseId=${selectedCourse._id}`}>
                      Create First Question Bank
                    </Link>
                  </Button>
                </div>
              ) : (
                qbs.map((qb) => (
                  <QuestionBankCard
                    key={qb._id}
                    qb={qb}
                    role="super-admin"
                    onDelete={handleDeleteQB}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
