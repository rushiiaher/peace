'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Loader from "@/components/ui/loader"
import { toast } from "sonner"
import { FileQuestion, HelpCircle, BookOpen, Eye, CheckCircle2, AlertCircle } from "lucide-react"

export default function InstituteQuestionBankPage() {
  const [courses, setCourses] = useState([])
  const [qbs, setQbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedQB, setSelectedQB] = useState<any>(null)

  useEffect(() => {
    fetchCourses()
    fetchQBs()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchQBs = async () => {
    try {
      const res = await fetch('/api/question-banks')
      const data = await res.json()
      setQbs(data)
    } catch (error) {
      toast.error('Failed to fetch question banks')
    }
  }

  const groupedQBs = courses.map((course: any) => ({
    course,
    qbs: qbs.filter((qb: any) => qb.courseId?._id === course._id)
  })).filter(g => g.qbs.length > 0)

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalQBs = qbs.length
  const totalQuestions = qbs.reduce((sum: number, qb: any) => sum + (qb.questions?.length || 0), 0)
  const totalCourses = groupedQBs.length

  return (
    <div className="space-y-6">
      <SectionHeader title="Question Bank" subtitle="Browse and review question repositories." />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <FileQuestion className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Question Banks</p>
                <p className="text-2xl font-bold">{totalQBs}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <HelpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Questions</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-xs text-muted-foreground mt-1">Available to use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Courses Covered</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-1">With QB content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Browse by Course
        </h3>
        {groupedQBs.length === 0 ? (
          <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No question banks found for any course.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {groupedQBs.map((group, i) => (
              <AccordionItem key={i} value={`course-${i}`} className="border rounded-xl px-4 bg-card shadow-sm">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        {group.course.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base">{group.course.name}</p>
                        <p className="text-xs text-muted-foreground">{group.qbs.length} Question Banks</p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.qbs.map((qb: any) => (
                      <Card key={qb._id} className="hover:shadow-md transition-shadow group border-primary/20">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <FileQuestion className="w-4 h-4 text-primary" />
                              <CardTitle className="text-sm font-medium line-clamp-1" title={qb.topic}>{qb.topic}</CardTitle>
                            </div>
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{qb.questions?.length || 0} Qs</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col gap-3">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            Click to view questions, options, and explanations.
                          </p>
                          <Button
                            size="sm"
                            className="w-full mt-auto bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
                            onClick={() => {
                              setSelectedQB(qb)
                              setViewOpen(true)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            Review Questions
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 border-b shrink-0 bg-muted/10">
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="w-fit mb-2 text-primary border-primary/20 bg-primary/5">{selectedQB?.courseId?.name}</Badge>
              <DialogTitle className="text-xl">{selectedQB?.topic}</DialogTitle>
              <CardDescription className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4" /> {selectedQB?.questions?.length || 0} Questions
              </CardDescription>
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
            {selectedQB && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {selectedQB.questions?.map((q: any, idx: number) => (
                  <Card key={idx} className="border shadow-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-card border-b flex flex-row gap-3 items-center">
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">{idx + 1}</Badge>
                      <h4 className="font-medium text-sm sm:text-base leading-snug">{q.question}</h4>
                    </CardHeader>
                    <CardContent className="p-4 bg-muted/5">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options?.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg text-sm border transition-colors flex items-center gap-3 ${i === q.correctAnswer
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 font-medium'
                              : 'bg-background border-border hover:bg-muted'
                              }`}
                          >
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full border text-xs shrink-0 ${i === q.correctAnswer ? 'border-green-500 bg-green-200 text-green-800' : 'border-muted-foreground/30 text-muted-foreground'
                              }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span>{opt}</span>
                            {i === q.correctAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg text-sm flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Explanation</p>
                            <p className="text-blue-800 dark:text-blue-100 leading-relaxed opacity-90">{q.explanation}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
