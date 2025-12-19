'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

export default function AdmitCardsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setStudentId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    if (!studentId) return
    fetch(`/api/admit-cards?studentId=${studentId}`)
      .then(res => res.json())
      .then(data => {
        setCards(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [studentId])

  if (loading) return <div className="space-y-6"><SectionHeader title="Admit Cards" subtitle="View your exam admit cards" /><Skeleton className="h-32 w-full" /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Admit Cards" subtitle="View your exam admit cards" />
      
      {cards.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No admit cards available</CardContent></Card>
      ) : (
        cards.map((card) => (
          <Card key={card._id} className="py-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{card.examTitle}</CardTitle>
                {(card.isRescheduled || card.rescheduled) && (
                  <Badge variant="outline" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                    ⚠ Rescheduled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(card.isRescheduled || card.rescheduled) && card.rescheduledReason && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Rescheduling Reason:</p>
                    <p className="text-sm text-yellow-800">{card.rescheduledReason}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{card.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{card.rollNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-medium">{card.courseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Institute</p>
                  <p className="font-medium">{card.instituteName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exam Date</p>
                  <p className="font-medium">{new Date(card.examDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exam Time</p>
                  <p className="font-medium">{card.startTime} - {card.endTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{card.duration} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Allocated PC</p>
                  <p className="font-medium">{card.systemName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
