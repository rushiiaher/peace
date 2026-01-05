'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, User, FileText, ChevronLeft, ChevronRight, Flag, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [exam, setExam] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [startTime] = useState(Date.now())
  const [studentId, setStudentId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string>('')
  const [studentDetails, setStudentDetails] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [canAttempt, setCanAttempt] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [examStarted, setExamStarted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // Track elapsed seconds

  // Security States
  const [warnings, setWarnings] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [lastViolationTime, setLastViolationTime] = useState(0) // Debounce violations

  // Full Screen & Security Logic
  const enterFullScreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => { })
    }
  }

  // Handle violations with debouncing to prevent duplicate warnings
  const handleViolation = (type: string) => {
    const now = Date.now()
    // Ignore if violation was triggered less than 2 seconds ago
    if (now - lastViolationTime < 2000) return

    setLastViolationTime(now)

    if (warnings >= 3) {
      handleSubmit(true)
      return
    }

    setWarnings(prev => {
      const newWarnings = prev + 1
      if (newWarnings >= 3) {
        handleSubmit(true)
      } else {
        toast.error(`Security Violation: ${type}`, {
          description: `Warning ${newWarnings}/3. Exam will auto-submit on 3rd warning.`
        })
      }
      return newWarnings
    })
  }

  useEffect(() => {
    if (!examStarted || !canAttempt || hasSubmitted) return

    // 1. Initial Full Screen Attempt
    const timer = setTimeout(() => {
      enterFullScreen()
    }, 1000)

    // 2. Event Listeners
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Visibility violation detected - tab switch/minimize')
        handleViolation("Tab Switch Detected")
      }
    }

    const handleFullScreenChange = () => {
      const isFull = !!document.fullscreenElement
      setIsFullScreen(isFull)
      // Full screen exit just shows blocker UI, doesn't count as violation
      // Actual violations are tracked via visibility change
    }

    // prevent console opening attempts
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullScreenChange)
    window.addEventListener("keydown", handleKeydown)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
      window.removeEventListener("keydown", handleKeydown)
    }
  }, [examStarted, canAttempt, hasSubmitted])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
      setStudentName(userData.name || 'Student')
      setStudentDetails(userData) // Save full details for display

      // If documents/photo not in localStorage, fetch fresh data from API
      if (!userData.documents?.photo && (userData.id || userData._id)) {
        fetch(`/api/users/${userData.id || userData._id}`)
          .then(res => res.json())
          .then(freshData => {
            if (freshData && !freshData.error) {
              setStudentDetails(freshData)
              // Optionally update localStorage with fresh data
              localStorage.setItem('user', JSON.stringify({
                ...userData,
                documents: freshData.documents,
                rollNo: freshData.rollNo
              }))
            }
          })
          .catch(err => console.error('Failed to fetch student details:', err))
      }
    }
  }, [])

  useEffect(() => {
    fetch(`/api/exams/${id}`)
      .then(res => res.json())
      .then(data => {
        const shuffledQuestions = [...(data.questions || [])].sort(() => 0.5 - Math.random())
        setExam({ ...data, questions: shuffledQuestions })
        setAnswers(new Array(shuffledQuestions.length).fill(-1))
        setMarkedForReview(new Array(shuffledQuestions.length).fill(false))
        // Duration is already in seconds from the API
        setTimeLeft(data.duration)

        if (data.type === 'Final' && studentId) {
          // Fix: Handle both populated (object) and unpopulated (string) studentId
          const assignment = data.systemAssignments?.find((a: any) =>
            (a.studentId?._id || a.studentId) === studentId
          )
          const isPresent = assignment?.attended || false
          setCanAttempt(isPresent)

          if (isPresent) {
            const examStartTime = new Date(`${data.date.split('T')[0]}T${data.startTime}`).getTime()
            const now = Date.now()
            const timeUntilStart = Math.floor((examStartTime - now) / 1000)

            if (timeUntilStart > 0) {
              setCountdown(timeUntilStart)
              setExamStarted(false)
            } else {
              setExamStarted(true)
            }
          }
        } else {
          setCanAttempt(true)
          setExamStarted(true)
        }
      })
  }, [id, studentId])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            setExamStarted(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (!examStarted || !canAttempt || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
      // Track elapsed time
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted, canAttempt, timeLeft])

  const handleSubmit = async (isAutoSubmit = false) => {
    if (hasSubmitted) return
    setHasSubmitted(true)

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    console.log('=== SUBMITTING EXAM ===')
    console.log('Total Questions:', exam.questions?.length)
    console.log('Answers Array:', answers)
    console.log('Answered Count:', answers.filter(a => a !== -1).length)
    console.log('Time Taken:', timeTaken, 'seconds')

    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          answers,
          timeTaken,
          autoSubmitted: isAutoSubmit,
          warnings
        })
      })

      const responseData = await res.json()
      console.log('Submission Response:', responseData)

      if (res.ok) {
        setHasSubmitted(true)
        if (isAutoSubmit) {
          toast.error('Exam Auto-Submitted', {
            description: 'Maximum security violations reached.'
          })
        } else {
          toast.success('Exam submitted successfully')
        }
        // Redirect to thank you page after 5 seconds
        setTimeout(() => {
          router.push('/student/exams')
        }, 5000)
      } else {
        console.error('Submission failed:', responseData)
        toast.error('Failed to submit exam')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit exam')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!exam) return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><Loader /></div>

  // Thank You Page after submission
  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        <Card className="max-w-2xl w-full mx-4 shadow-2xl border-2 border-primary/20 relative z-10">
          <CardContent className="py-16 text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>

            {/* Thank You Message */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-primary">Thank You!</h1>
              <p className="text-xl text-muted-foreground">Your exam has been submitted successfully</p>
            </div>

            {/* Exam Details */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Exam</span>
                <span className="font-semibold">{exam.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Student</span>
                <span className="font-semibold">{studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Questions Attempted</span>
                <span className="font-semibold">{answers.filter(a => a !== -1).length} / {exam.questions?.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time Taken</span>
                <span className="font-semibold">{formatTime(Math.floor((Date.now() - startTime) / 1000))}</span>
              </div>
              {warnings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Security Warnings</span>
                  <span className="font-semibold text-orange-600">{warnings}</span>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Your answers have been recorded and will be evaluated shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Results will be available once the evaluation is complete.
              </p>
            </div>

            {/* Redirect Message */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground animate-pulse">
                Redirecting to exam dashboard in 5 seconds...
              </p>
              <Button
                onClick={() => router.push('/student/exams')}
                className="mt-4"
                size="lg"
              >
                Go to Dashboard Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  if (!canAttempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-orange-500" />
            <h2 className="text-xl font-semibold">Waiting for Attendance</h2>
            <p className="text-muted-foreground">Please wait for the institute admin to mark your attendance before starting the exam.</p>
            <Button onClick={() => router.push('/student/exams')}>Back to Exams</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center space-y-6">
            <Clock className="w-16 h-16 mx-auto text-blue-500" />
            <h2 className="text-xl font-semibold">Exam Starting Soon</h2>
            <p className="text-muted-foreground">You are marked present. Exam will start automatically in:</p>
            <div className="text-5xl font-bold text-blue-600">{formatTime(countdown)}</div>
            <p className="text-sm text-muted-foreground">Scheduled time: {exam.startTime}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = exam.questions?.[currentQuestion]
  const answeredCount = answers.filter(a => a !== -1).length
  const markedCount = markedForReview.filter(m => m).length
  // const notVisitedCount = exam.questions?.length - answeredCount - markedCount // Removed unused variable

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Fullscreen Enforcement Overlay */}
      {(!isFullScreen && !hasSubmitted) && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-destructive/20">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-destructive">Security Violation</h2>
                <p className="text-muted-foreground">
                  Full screen mode is required to attempt this exam.
                  Exiting full screen or switching tabs is recorded as a violation.
                </p>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="font-semibold text-destructive">
                  Warnings: {warnings} / 3
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exam will auto-submit after 3 warnings.
                </p>
              </div>
              <Button
                type="button"
                onClick={enterFullScreen}
                className="w-full bg-destructive hover:bg-destructive/90 text-white"
                size="lg"
              >
                Enter Full Screen Mode
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{studentName}</p>
                  <p className="text-xs text-muted-foreground">{exam.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {warnings > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  Warnings: {warnings}/3
                </Badge>
              )}
              <Badge variant={timeLeft < 300 ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Question {currentQuestion + 1} of {exam.questions?.length}
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">2 Marks</Badge>
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant={markedForReview[currentQuestion] ? 'default' : 'outline'}
                  onClick={() => {
                    const newMarked = [...markedForReview]
                    newMarked[currentQuestion] = !newMarked[currentQuestion]
                    setMarkedForReview(newMarked)
                  }}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {markedForReview[currentQuestion] ? 'Marked' : 'Mark for Review'}
                </Button>
              </div>

              <div className="space-y-6">
                <p className="text-base leading-relaxed">{currentQ?.question}</p>

                <RadioGroup
                  value={answers[currentQuestion] !== undefined && answers[currentQuestion] !== -1 ? answers[currentQuestion].toString() : ""}
                  onValueChange={(v) => {
                    const newAnswers = [...answers]
                    newAnswers[currentQuestion] = parseInt(v)
                    setAnswers(newAnswers)
                    console.log(`Question ${currentQuestion + 1}: Selected option ${parseInt(v)} (${String.fromCharCode(65 + parseInt(v))})`)
                  }}
                  className="space-y-3"
                >
                  {currentQ?.options?.map((opt: string, j: number) => (
                    <div
                      key={j}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${answers[currentQuestion] === j ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <RadioGroupItem
                        value={j.toString()}
                        id={`q${currentQuestion}-opt${j}`}
                      />
                      <Label htmlFor={`q${currentQuestion}-opt${j}`} className="cursor-pointer flex-1 text-base">
                        <span className="font-medium mr-2">({String.fromCharCode(65 + j)})</span>
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            {/* Main Navigation Row */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newAnswers = [...answers]
                  newAnswers[currentQuestion] = -1
                  setAnswers(newAnswers)
                }}
                size="lg"
              >
                Clear Response
              </Button>
              {currentQuestion < exam.questions?.length - 1 && (
                <Button
                  type="button"
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex-1"
                  size="lg"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Separate Submit Exam Button */}
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={elapsedTime < 1800} // 30 minutes = 1800 seconds
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-6"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {elapsedTime < 1800
                ? `Submit Exam (Available in ${Math.ceil((1800 - elapsedTime) / 60)} min)`
                : 'Submit Exam'}
            </Button>

            {elapsedTime < 1800 && (
              <p className="text-xs text-center text-muted-foreground">
                Submit button will be enabled after 30 minutes from exam start
              </p>
            )}
          </div>
        </div >

        {/* Question Palette */}
        <div className="space-y-4">
          {/* Student Details Card - ID Verification */}
          {studentDetails && (
            <Card className="shadow-lg border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Rectangular Photo ID */}
                  <div className="shrink-0">
                    <div className="w-20 h-24 rounded-lg border-2 border-primary/30 bg-muted/30 flex items-center justify-center overflow-hidden">
                      {studentDetails.documents?.photo ? (
                        <img
                          src={studentDetails.documents.photo}
                          alt={studentName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary">
                            {studentName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-center text-muted-foreground mt-1">Student ID</p>
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{studentName}</h4>
                    <p className="text-xs text-muted-foreground">Roll: {studentDetails.rollNo || 'N/A'}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{exam.title}</p>
                    <Badge variant="outline" className="mt-2 text-[10px]">Verified</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg sticky top-20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Question Palette</h3>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white font-medium">{answeredCount}</div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white font-medium">{exam.questions?.length - answeredCount}</div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center text-white font-medium">{markedCount}</div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white font-medium">-</div>
                  <span>Answered + Marked</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-1">
                  {exam.questions?.map((_: any, i: number) => {
                    const isAnswered = answers[i] !== -1
                    const isMarked = markedForReview[i]
                    const isCurrent = i === currentQuestion

                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`w-8 h-8 rounded-sm font-medium text-xs transition-all flex items-center justify-center ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          } ${isAnswered && isMarked
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : isAnswered
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : isMarked
                                ? 'bg-violet-500 text-white hover:bg-violet-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div >
      </div >
    </div >
  )
}
