'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Star, MessageSquare, CheckCircle, BookOpen, Send } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function StudentFeedbackPage() {
  const [forms, setForms] = useState<any[]>([])
  const [myResponses, setMyResponses] = useState<any[]>([])
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [answers, setAnswers] = useState<any>({})
  const [studentId, setStudentId] = useState<string | null>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (studentId && instituteId) fetchData()
  }, [studentId, instituteId])

  const fetchData = async () => {
    try {
      const [formsRes, responsesRes] = await Promise.all([
        fetch(`/api/feedback-forms?instituteId=${instituteId}`),
        fetch(`/api/feedback-responses?studentId=${studentId}`)
      ])
      setForms(await formsRes.json())
      setMyResponses(await responsesRes.json())
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const openForm = (form: any) => {
    setSelectedForm(form)
    setAnswers({})
    setSubmitOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const responses = selectedForm.questions.map((q: any) => ({
      questionId: q._id,
      answer: answers[q._id] || ''
    }))

    const data = {
      formId: selectedForm._id,
      studentId,
      instituteId: selectedForm.instituteId._id,
      courseId: selectedForm.courseId._id,
      responses
    }

    try {
      const res = await fetch('/api/feedback-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Feedback submitted')
        setSubmitOpen(false)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to submit feedback')
    }
  }

  const isSubmitted = (formId: string) => myResponses.some(r => r.formId?._id === formId)

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  const pendingForms = forms.filter(f => !isSubmitted(f._id)).length

  return (
    <div className="space-y-6">
      <SectionHeader title="Feedback" subtitle="Share your feedback on courses" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Forms</p>
                <p className="text-3xl font-bold mt-2">{pendingForms}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-3xl font-bold mt-2">{myResponses.length}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Forms</p>
                <p className="text-3xl font-bold mt-2">{forms.length}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Available Forms</h3>
        {forms.filter(f => !isSubmitted(f._id)).map((form) => (
          <Card key={form._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{form.title}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{form.courseId?.name}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => openForm(form)}><Send className="w-4 h-4 mr-2" />Submit</Button>
              </div>
            </CardHeader>
            {form.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{form.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
        {forms.filter(f => !isSubmitted(f._id)).length === 0 && (
          <p className="text-center text-muted-foreground py-8">No pending feedback forms</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Submitted Feedback</h3>
        {myResponses.map((resp) => (
          <Card key={resp._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <CardTitle className="text-base">{resp.formId?.title}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{resp.courseId?.name}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{new Date(resp.submittedAt).toLocaleDateString()}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
        {myResponses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No submitted feedback yet</p>
        )}
      </div>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title}</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedForm.description && (
                <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
              )}
              {selectedForm.questions?.map((q: any, idx: number) => (
                <div key={q._id}>
                  <Label>{idx + 1}. {q.question} {q.required && <span className="text-red-500">*</span>}</Label>
                  {q.type === 'text' && (
                    <Textarea
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                      required={q.required}
                      className="mt-2"
                    />
                  )}
                  {q.type === 'rating' && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer ${star <= (answers[q._id] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          onClick={() => setAnswers({ ...answers, [q._id]: star })}
                        />
                      ))}
                    </div>
                  )}
                  {q.type === 'choice' && (
                    <div className="space-y-2 mt-2">
                      {q.options?.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={q._id}
                            value={opt}
                            checked={answers[q._id] === opt}
                            onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                            required={q.required}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full"><Send className="w-4 h-4 mr-2" />Submit Feedback</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
