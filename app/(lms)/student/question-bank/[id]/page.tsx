'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Loader from "@/components/ui/loader"

export default function QBPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [qb, setQb] = useState<any>(null)
  const [mode, setMode] = useState<'select' | 'step' | 'full'>('select')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    fetch(`/api/question-banks/${id}`)
      .then(res => res.json())
      .then(setQb)
  }, [id])

  const handleStepAnswer = (answerIdx: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQ] = answerIdx
    setAnswers(newAnswers)
  }

  const handleStepCheck = () => {
    setShowAnswer(true)
  }

  const handleStepNext = () => {
    if (currentQ < qb.questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setShowAnswer(false)
    } else {
      setShowResult(true)
    }
  }

  const handleFullSubmit = () => {
    setShowResult(true)
  }

  const score = answers.filter((a, i) => a === qb?.questions[i]?.correctAnswer).length

  if (!qb) return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  if (mode === 'select') {
    return (
      <div className="space-y-6">
        <SectionHeader title={qb.topic} subtitle={`${qb.questions.length} questions available`} />
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary" onClick={() => setMode('step')}>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">Step-by-Step Mode</h3>
              <p className="text-sm text-muted-foreground">Answer one question at a time and see immediate feedback</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary" onClick={() => setMode('full')}>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">Full Practice Mode</h3>
              <p className="text-sm text-muted-foreground">Answer all questions and get results at the end</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showResult) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Results" subtitle={`You scored ${score} out of ${qb.questions.length}`} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold">{Math.round((score / qb.questions.length) * 100)}%</div>
              <p className="text-muted-foreground">{score} correct answers out of {qb.questions.length} questions</p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {qb.questions.map((q: any, i: number) => (
            <Card key={i} className={answers[i] === q.correctAnswer ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium">Q{i + 1}. {q.question}</p>
                  <Badge variant={answers[i] === q.correctAnswer ? 'default' : 'destructive'}>
                    {answers[i] === q.correctAnswer ? 'Correct' : 'Wrong'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Your answer: {q.options[answers[i]] || 'Not answered'}</p>
                <p className="text-sm text-green-600">Correct answer: {q.options[q.correctAnswer]}</p>
                {q.explanation && <p className="text-sm bg-blue-50 dark:bg-blue-900 p-2 rounded">{q.explanation}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button onClick={() => router.push('/student/question-bank')}>Back to Question Banks</Button>
      </div>
    )
  }

  const question = qb.questions[currentQ]

  if (mode === 'step') {
    return (
      <div className="space-y-6">
        <SectionHeader title={qb.topic} subtitle={`Question ${currentQ + 1} of ${qb.questions.length}`} />
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-lg font-medium">{question.question}</p>
            <RadioGroup key={currentQ} value={answers[currentQ] !== undefined ? answers[currentQ].toString() : undefined} onValueChange={(v) => handleStepAnswer(parseInt(v))}>
              {question.options.map((opt: string, i: number) => (
                <div key={i} className={`flex items-center space-x-2 p-3 rounded border ${showAnswer && i === question.correctAnswer ? 'bg-green-100 dark:bg-green-900 border-green-500' :
                  showAnswer && answers[currentQ] === i && i !== question.correctAnswer ? 'bg-red-100 dark:bg-red-900 border-red-500' : ''
                  }`}>
                  <RadioGroupItem value={i.toString()} id={`opt-${i}`} disabled={showAnswer} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
            {showAnswer && question.explanation && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <p className="font-medium">Explanation:</p>
                <p className="text-sm">{question.explanation}</p>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/student/question-bank')}>Exit</Button>
              <div className="flex gap-2">
                {!showAnswer ? (
                  <Button onClick={handleStepCheck} disabled={answers[currentQ] === undefined}>Check Answer</Button>
                ) : (
                  <Button onClick={handleStepNext}>{currentQ === qb.questions.length - 1 ? 'Finish' : 'Next'}</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={qb.topic} subtitle="Answer all questions and submit" />
      <div className="space-y-4">
        {qb.questions.map((q: any, i: number) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <p className="font-medium">Q{i + 1}. {q.question}</p>
              <RadioGroup value={answers[i]?.toString()} onValueChange={(v) => {
                const newAnswers = [...answers]
                newAnswers[i] = parseInt(v)
                setAnswers(newAnswers)
              }}>
                {q.options.map((opt: string, j: number) => (
                  <div key={j} className="flex items-center space-x-2">
                    <RadioGroupItem value={j.toString()} id={`q${i}-opt${j}`} />
                    <Label htmlFor={`q${i}-opt${j}`} className="cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/student/question-bank')}>Cancel</Button>
        <Button onClick={handleFullSubmit}>
          Submit ({answers.filter(a => a !== undefined).length}/{qb.questions.length})
        </Button>
      </div>
    </div>
  )
}
