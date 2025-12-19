'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Loader from "@/components/ui/loader"

function RescheduleExamContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = searchParams.get('examId')

  const [exam, setExam] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [reason, setReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState('')
  const [originalStudents, setOriginalStudents] = useState<any[]>([])
  const [showOriginalStudents, setShowOriginalStudents] = useState(false)

  useEffect(() => {
    if (examId) {
      const urlParams = new URLSearchParams(window.location.search)
      const mode = urlParams.get('view') || ''
      setViewMode(mode)
      fetchExamData(mode)
    }
  }, [examId])

  const fetchExamData = async (mode?: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/reschedule-students`)
      if (!res.ok) {
        const errorData = await res.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch exam data')
      }
      const data = await res.json()
      console.log('Fetched exam data:', data)
      console.log('Students:', data.students)
      setExam(data.exam)
      setStudents(data.students || [])

      // If this is edit mode, pre-fill date and reason from existing data
      const currentMode = mode || viewMode
      if (currentMode === 'edit') {
        // Pre-fill date from exam
        if (data.exam?.date) {
          const examDate = new Date(data.exam.date)
          setRescheduleDate(examDate.toISOString().split('T')[0])
          console.log('Pre-filled date:', examDate.toISOString().split('T')[0])
        }
        // Pre-fill reason from first rescheduled student
        console.log('Looking for rescheduled student with reason...')
        const rescheduledStudent = data.students?.find((s: any) => s.rescheduled && s.rescheduledReason)
        console.log('Found rescheduled student:', rescheduledStudent)
        if (rescheduledStudent?.rescheduledReason) {
          setReason(rescheduledStudent.rescheduledReason)
          console.log('Pre-filled reason:', rescheduledStudent.rescheduledReason)
        } else {
          console.log('No rescheduled reason found - user must enter it')
          setReason('') // Clear any previous reason
        }
        await fetchOriginalStudents(data.exam, data.students || [])
      }

      if (!data.students || data.students.length === 0) {
        toast.info('No students found for this exam')
      }
    } catch (error: any) {
      console.error('Fetch error:', error)
      toast.error(error.message || 'Failed to fetch exam data')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOriginalStudents = async (currentExam: any, currentStudents: any[] = []) => {
    try {
      const res = await fetch(`/api/exams/${currentExam._id}/available-students`)
      if (res.ok) {
        const data = await res.json()
        console.log('Available students from original exam:', data.students)
        setOriginalStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch original students:', error)
    }
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const handleReschedule = async () => {
    console.log('handleReschedule called')
    console.log('viewMode:', viewMode)
    console.log('selectedStudents:', selectedStudents)
    console.log('rescheduleDate:', rescheduleDate)
    console.log('reason:', reason)

    if (selectedStudents.length === 0) {
      console.log('Validation failed: no students selected')
      toast.error('Please select at least one student')
      return
    }

    // In edit mode, check if we need date/reason
    if (viewMode === 'edit') {
      const existingStudentIds = students.map(s => s.studentId)
      const hasExistingStudents = selectedStudents.some(id => existingStudentIds.includes(id))
      const hasNewStudents = selectedStudents.some(id => !existingStudentIds.includes(id))

      // If updating existing students OR adding new students, date and reason are required
      if (!rescheduleDate) {
        console.log('Validation failed: no reschedule date')
        toast.error('Please select reschedule date')
        return
      }
      if (!reason.trim()) {
        console.log('Validation failed: no reason')
        toast.error('Please enter reason for rescheduling')
        return
      }
    } else {
      // Non-edit mode always requires date and reason
      if (!rescheduleDate) {
        console.log('Validation failed: no reschedule date')
        toast.error('Please select reschedule date')
        return
      }
      if (!reason.trim()) {
        console.log('Validation failed: no reason')
        toast.error('Please enter reason for rescheduling')
        return
      }
    }

    console.log('Submitting:', { examId, studentIds: selectedStudents, rescheduleDate, reason })

    setSubmitting(true)
    try {
      const apiUrl = viewMode === 'edit' ? '/api/exams/update-reschedule' : '/api/exams/bulk-reschedule'
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          studentIds: selectedStudents,
          rescheduleDate,
          reason
        })
      })

      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)

      if (res.ok) {
        toast.success(data.message)
        if (viewMode === 'edit') {
          setSelectedStudents([])
          setShowOriginalStudents(false)
          await fetchExamData(viewMode)
        } else {
          router.push('/super-admin/exams')
        }
      } else {
        toast.error(data.error || 'Failed to reschedule')
      }
    } catch (error) {
      console.error('Reschedule error:', error)
      toast.error('Failed to reschedule exam')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
  }

  if (!exam) {
    return <div className="flex items-center justify-center h-screen">Exam not found</div>
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={
          viewMode === 'rescheduled' ? 'Rescheduled Students' :
            viewMode === 'edit' ? 'Edit Rescheduled Students' :
              'Reschedule Exam for Students'
        }
        subtitle={`${exam?.title} - ${exam?.courseId?.name}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Institute</p>
              <p className="font-medium">{exam?.instituteId?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Original Date</p>
              <p className="font-medium">{new Date(exam?.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{exam?.duration} mins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode !== 'rescheduled' && (
        <Card>
          <CardHeader>
            <CardTitle>Reschedule Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rescheduleDate">Rescheduled Date</Label>
              <Input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-1">
                System will automatically skip Sundays and allocate next working day if needed
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Rescheduling</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., System crashed, Network issue, Power failure"
                rows={3}
              />
            </div>
            {viewMode === 'edit' && (
              <>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Edit Mode:</strong> You can modify reschedule date/reason for existing students and add new students from the original exam below.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'edit' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Students from Original Exam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Add Students:</strong> Select students from the original exam who haven't been rescheduled yet. Click "Update" button below to add them.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showOriginal"
                  checked={showOriginalStudents}
                  onChange={(e) => setShowOriginalStudents(e.target.checked)}
                  className="w-4 h-4"
                  disabled={originalStudents.length === 0}
                />
                <Label htmlFor="showOriginal" className="cursor-pointer text-sm font-medium">
                  Show available students ({originalStudents.length} remaining)
                </Label>
              </div>
              {showOriginalStudents && originalStudents.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const originalIds = originalStudents.map(s => s.studentId)
                      setSelectedStudents([...selectedStudents, ...originalIds])
                    }}
                  >
                    Select All Available
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const originalIds = originalStudents.map(s => s.studentId)
                      setSelectedStudents(selectedStudents.filter(id => !originalIds.includes(id)))
                    }}
                  >
                    Deselect All Available
                  </Button>
                </div>
              )}
            </div>
            {showOriginalStudents && originalStudents.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Select</th>
                      <th className="p-3 font-medium">Roll No</th>
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Exam Date</th>
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">System</th>
                      <th className="p-3 font-medium">Questions Attempted</th>
                      <th className="p-3 font-medium">Score</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {originalStudents.map((student) => (
                      <tr key={student.studentId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.studentId)}
                            onChange={() => toggleStudent(student.studentId)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-3 font-medium">{student.rollNo}</td>
                        <td className="p-3">{student.name}</td>
                        <td className="p-3 text-blue-600">{new Date(student.scheduledDate).toLocaleDateString('en-GB')}</td>
                        <td className="p-3">{student.scheduledTime}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {student.systemName}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">Not Attempted</td>
                        <td className="p-3 text-muted-foreground">-</td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Available
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {originalStudents.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No additional students available from the original exam.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {viewMode === 'rescheduled' ? 'Rescheduled Students' : `Select Students (${selectedStudents.length} selected)`}
            </CardTitle>
            {viewMode !== 'rescheduled' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudents(students.map(s => s.studentId))}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  {viewMode !== 'rescheduled' && <th className="p-2">Select</th>}
                  <th className="p-2">Roll No</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">{viewMode === 'rescheduled' || viewMode === 'edit' ? 'Rescheduled Date' : 'Exam Date'}</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">System</th>
                  {viewMode === 'rescheduled' || viewMode === 'edit' ? (
                    <>
                      <th className="p-2">Original Date</th>
                      <th className="p-2">Reschedule Reason</th>
                      <th className="p-2">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2">Questions Attempted</th>
                      <th className="p-2">Score</th>
                      <th className="p-2">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {students && students.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'rescheduled' ? 9 : 10} className="p-8 text-center text-muted-foreground">
                      No students assigned to this exam. Please ensure the exam has student assignments.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.studentId} className="border-b hover:bg-muted/50">
                      {viewMode !== 'rescheduled' && (
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.studentId)}
                            onChange={() => toggleStudent(student.studentId)}
                            className="w-4 h-4"
                          />
                        </td>
                      )}
                      <td className="p-2 font-medium">
                        {student.rollNo}
                        {showOriginalStudents && originalStudents.includes(student) && (
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Original
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">{student.name || 'N/A'}</td>
                      <td className="p-2">
                        <div className="text-sm font-medium text-blue-600">
                          {new Date(student.scheduledDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">
                          {student.scheduledTime}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {student.systemName}
                        </Badge>
                      </td>
                      {viewMode === 'rescheduled' || viewMode === 'edit' ? (
                        <>
                          <td className="p-2">
                            <div className="text-sm text-muted-foreground">
                              {student.originalDate ? new Date(student.originalDate).toLocaleDateString() : new Date(exam?.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm text-muted-foreground max-w-xs truncate" title={student.rescheduledReason || 'No reason provided'}>
                              {student.rescheduledReason || 'No reason provided'}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Rescheduled
                            </Badge>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">
                            {student.hasAttempted ? (
                              <span>{student.questionsAttempted} / {student.totalQuestions}</span>
                            ) : (
                              <span className="text-muted-foreground">Not Attempted</span>
                            )}
                          </td>
                          <td className="p-2">
                            {student.hasAttempted ? (
                              <span className="font-medium">{student.score} / {student.totalMarks}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant={student.hasAttempted ? 'default' : 'outline'}>
                              {student.hasAttempted ? 'Completed' : 'Scheduled'}
                            </Badge>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {viewMode !== 'rescheduled' && (
          <Button onClick={handleReschedule} disabled={submitting}>
            {submitting ? 'Processing...' : viewMode === 'edit' ? `Update (${selectedStudents.length} selected)` : `Reschedule ${selectedStudents.length} Student(s)`}
          </Button>
        )}
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  )
}

export default function RescheduleExamPage() {
  return (
    <Suspense fallback={<div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>}>
      <RescheduleExamContent />
    </Suspense>
  )
}
