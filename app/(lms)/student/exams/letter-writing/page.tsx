'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/lms/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LetterWritingEditor } from '@/components/lms/letter-writing-editor'
import { toast } from 'sonner'
import { Save, Send, CheckCircle2, PenLine } from 'lucide-react'

const AUTOSAVE_MS = 2000

export default function LetterWritingPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [html, setHtml] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const draftKey = studentId ? `letter-writing:draft:${studentId}` : null
  const submitKey = studentId ? `letter-writing:submission:${studentId}` : null

  // Resolve student
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const u = JSON.parse(user)
      setStudentId(u.id || u._id)
    }
  }, [])

  // Restore draft / prior submission
  useEffect(() => {
    if (!draftKey || !submitKey) return
    const sub = localStorage.getItem(submitKey)
    if (sub) {
      try {
        const parsed = JSON.parse(sub)
        setHtml(parsed.html || '')
        setSubmitted(true)
        setLoaded(true)
        return
      } catch { /* ignore corrupt */ }
    }
    const draft = localStorage.getItem(draftKey)
    if (draft) setHtml(draft)
    setLoaded(true)
  }, [draftKey, submitKey])

  // Debounced auto-save of the draft
  useEffect(() => {
    if (!loaded || submitted || !draftKey) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey, html)
      setSavedAt(new Date())
    }, AUTOSAVE_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [html, loaded, submitted, draftKey])

  const saveNow = () => {
    if (!draftKey) return
    localStorage.setItem(draftKey, html)
    setSavedAt(new Date())
    toast.success('Draft saved')
  }

  const handleSubmit = () => {
    if (!submitKey) return
    const plain = html.replace(/<[^>]*>/g, '').trim()
    if (!plain) {
      toast.error('Letter is empty')
      return
    }
    localStorage.setItem(submitKey, JSON.stringify({ html, submittedAt: new Date().toISOString() }))
    setSubmitted(true)
    toast.success('Letter submitted')
  }

  const wordCount = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Section 2 — Letter Writing" subtitle="Compose your letter using the formatting toolbar." />
        {submitted ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Submitted
          </Badge>
        ) : savedAt ? (
          <span className="text-xs text-muted-foreground">
            Auto-saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4 text-indigo-600" />
            {submitted ? 'Your Submitted Letter' : 'Your Letter'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <LetterWritingEditor
            value={html}
            onChange={setHtml}
            readOnly={submitted}
            placeholder="e.g. write the date right-aligned, then the recipient, body, and a right-aligned signature…"
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            {!submitted && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveNow}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="h-4 w-4 mr-2" /> Submit Letter
                </Button>
              </div>
            )}
            {submitted && (
              <Button variant="outline" onClick={() => router.push('/student/exams')}>
                Back to Exams
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
