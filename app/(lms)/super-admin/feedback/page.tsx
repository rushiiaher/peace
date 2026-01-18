'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Trash2, MessageSquare, Star, CheckCircle, Building2, BookOpen, BarChart2 } from "lucide-react"
import Link from "next/link"
import Loader from "@/components/ui/loader"

export default function SuperAdminFeedbackPage() {
  const [forms, setForms] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [institutes, setInstitutes] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [questions, setQuestions] = useState([{ question: '', type: 'text', required: true }])
  const [loading, setLoading] = useState(true)

  const [filterInstitute, setFilterInstitute] = useState("all")
  const [filterCourse, setFilterCourse] = useState("all")

  // ... fetch data ...

  const filteredForms = forms.filter(f => {
    const matchInst = filterInstitute === 'all' || f.instituteId?._id === filterInstitute
    const matchCourse = filterCourse === 'all' || f.courseId?._id === filterCourse
    return matchInst && matchCourse
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [formsRes, responsesRes, institutesRes, coursesRes] = await Promise.all([
        fetch('/api/feedback-forms'),
        fetch('/api/feedback-responses'),
        fetch('/api/institutes'),
        fetch('/api/courses')
      ])
      setForms(await formsRes.json())
      setResponses(await responsesRes.json())
      setInstitutes(await institutesRes.json())
      setCourses(await coursesRes.json())
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      instituteId: formData.get('instituteId'),
      courseId: formData.get('courseId'),
      questions: questions.filter(q => q.question.trim())
    }

    try {
      const res = await fetch('/api/feedback-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Feedback form created')
        setCreateOpen(false)
        setQuestions([{ question: '', type: 'text', required: true }])
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to create form')
    }
  }

  const deleteForm = async (id: string) => {
    if (!confirm('Delete this form?')) return
    try {
      await fetch(`/api/feedback-forms/${id}`, { method: 'DELETE' })
      toast.success('Form deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete form')
    }
  }

  const addQuestion = () => setQuestions([...questions, { question: '', type: 'text', required: true }])
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx))
  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setQuestions(updated)
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SectionHeader title="Feedback Management" subtitle="Create forms and view student responses" />
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Create Form</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Forms</p>
                <p className="text-2xl font-bold">{forms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Rate</p>
                <p className="text-2xl font-bold">{forms.length > 0 ? Math.round((responses.length / forms.length) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-muted/40 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-wrap">
          <div className="w-full sm:w-72">
            <Select value={filterInstitute} onValueChange={setFilterInstitute}>
              <SelectTrigger className="bg-background w-full">
                <SelectValue placeholder="All Institutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutes</SelectItem>
                {institutes.map((inst) => (
                  <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-72">
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="bg-background w-full">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Showing {filteredForms.length} forms
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredForms.map((form) => (
          <Card key={form._id} className="hover:border-primary/50 transition-colors flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base line-clamp-1" title={form.title}>{form.title}</CardTitle>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {form.instituteId?.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {form.courseId?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{form.description || "No description provided."}</p>

              <div className="mt-auto pt-2 space-y-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Questions: {form.questions?.length || 0}</span>
                  <Badge variant={form.status === 'Active' ? 'default' : 'secondary'}>{form.status}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" variant="outline" asChild>
                    <Link href={`/super-admin/feedback/${form._id}`}>
                      <BarChart2 className="w-4 h-4" />
                      Analytics
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteForm(form._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredForms.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No feedback forms match your filters.
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Feedback Form</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateForm} className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input id="title" name="title" required placeholder="Course Feedback" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Please share your feedback" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instituteId">Institute</Label>
                <Select name="instituteId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select institute" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.map((inst) => (
                      <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="courseId">Course</Label>
                <Select name="courseId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Questions</Label>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-1" />Add
                </Button>
              </div>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      placeholder="Question"
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                      className="flex-1"
                    />
                    <Select value={q.type} onValueChange={(v) => updateQuestion(idx, 'type', v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="choice">Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    {questions.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeQuestion(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">Create Form</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
