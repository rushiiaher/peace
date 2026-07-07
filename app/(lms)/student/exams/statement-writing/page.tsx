'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/lms/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatementWritingEditor, emptySheet, type SheetData } from '@/components/lms/statement-writing-editor'
import { toast } from 'sonner'
import { Save, Send, CheckCircle2, Table2 } from 'lucide-react'

const AUTOSAVE_MS = 2000

export default function StatementWritingPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetData>(() => emptySheet())
  const [submitted, setSubmitted] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const draftKey = studentId ? `statement-writing:draft:${studentId}` : null
  const submitKey = studentId ? `statement-writing:submission:${studentId}` : null

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const u = JSON.parse(user)
      setStudentId(u.id || u._id)
    }
  }, [])

  // Restore prior submission or draft
  useEffect(() => {
    if (!draftKey || !submitKey) return
    const sub = localStorage.getItem(submitKey)
    if (sub) {
      try {
        const parsed = JSON.parse(sub)
        if (parsed.sheet) setSheet(parsed.sheet)
        setSubmitted(true)
        setLoaded(true)
        return
      } catch { /* ignore corrupt */ }
    }
    const draft = localStorage.getItem(draftKey)
    if (draft) {
      try { setSheet(JSON.parse(draft)) } catch { /* ignore */ }
    }
    setLoaded(true)
  }, [draftKey, submitKey])

  // Debounced auto-save
  useEffect(() => {
    if (!loaded || submitted || !draftKey) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(sheet))
      setSavedAt(new Date())
    }, AUTOSAVE_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [sheet, loaded, submitted, draftKey])

  const saveNow = () => {
    if (!draftKey) return
    localStorage.setItem(draftKey, JSON.stringify(sheet))
    setSavedAt(new Date())
    toast.success('Draft saved')
  }

  const handleSubmit = () => {
    if (!submitKey) return
    const filled = Object.values(sheet.cells).some((v) => v.trim() !== '')
    if (!filled) {
      toast.error('Spreadsheet is empty')
      return
    }
    localStorage.setItem(submitKey, JSON.stringify({ sheet, submittedAt: new Date().toISOString() }))
    setSubmitted(true)
    toast.success('Statement submitted')
  }

  const filledCount = Object.values(sheet.cells).filter((v) => v.trim() !== '').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Section 2 — Statement Writing (Excel)" subtitle="Enter your data into the spreadsheet below." />
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
            <Table2 className="h-4 w-4 text-emerald-600" />
            {submitted ? 'Your Submitted Statement' : 'Your Statement'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <StatementWritingEditor value={sheet} onChange={setSheet} readOnly={submitted} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{filledCount} cells filled</span>
            {!submitted ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveNow}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="h-4 w-4 mr-2" /> Submit Statement
                </Button>
              </div>
            ) : (
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
