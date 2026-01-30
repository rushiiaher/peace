'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateAdmitCardHtml } from "@/utils/generate-admit-card"
import { toast } from "sonner"

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

  const getDynamicDuration = (card: any) => {
    let displayDuration = card.duration;
    if (card.examId?.courseId?.examConfigurations) {
      // Try to match examNumber from admit card or exam object to the course config
      let examNum = card.examNumber || card.examId.examNumber;

      // If missing, try to infer from title (e.g. "Exam 2 ...")
      if (!examNum) {
        const titleToCheck = card.examTitle || card.examId.title || '';
        const match = titleToCheck.match(/Exam\s*(\d+)/i);
        if (match) examNum = parseInt(match[1]);
      }

      // Default to 1
      if (!examNum) examNum = 1;

      const config = card.examId.courseId.examConfigurations.find((c: any) => Number(c.examNumber) === Number(examNum));

      if (config?.duration) {
        displayDuration = config.duration;
      } else if (card.examId.courseId.examConfigurations.length === 1) {
        // Fallback: If no specific match but only 1 config exists, use it (safe default)
        displayDuration = card.examId.courseId.examConfigurations[0].duration || displayDuration;
      }

      // Force valid Duration
      if (!displayDuration || isNaN(displayDuration)) displayDuration = 60;
    }
    return displayDuration;
  }

  const handleDownload = (card: any) => {
    try {
      // Helper to adjust time
      const adjustTime = (timeStr: string, minutesToSubtract: number) => {
        if (!timeStr) return '00:00'
        const [hours, minutes] = timeStr.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)
        date.setMinutes(date.getMinutes() - minutesToSubtract)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
      }

      const displayDuration = getDynamicDuration(card);

      const data = {
        instituteName: "PEACEXperts Academy, Nashik", // Hardcoded as per image header preference
        candidateName: card.studentName,
        photoUrl: card.studentId?.documents?.photo,
        systemName: card.systemName,
        rollNo: card.rollNo,
        studentName: card.studentName,
        motherName: card.studentId?.motherName || '__________',
        aadhaarCard: card.studentId?.aadhaarCardNo || '__________',
        examCentreCode: 'DLC-IT' + (card.rollNo?.substring(0, 4) || '1081'),
        batch: card.batchName || 'Regular Batch',
        examDate: new Date(card.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        reportingTime: adjustTime(card.startTime, 30),
        gateClosingTime: adjustTime(card.startTime, 5),
        examStartTime: adjustTime(card.startTime, 0),
        examDuration: `${displayDuration} Minutes`,
        courseName: card.courseName,
        examCentreName: card.instituteName,
        examCentreAddress: "Exam Center Address will be provided by Institute." // Placeholder as address is not in text
      }

      const html = generateAdmitCardHtml(data)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      } else {
        toast.error("Please allow popups to download admit card")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate admit card")
    }
  }

  if (loading) return <div className="space-y-6"><SectionHeader title="Admit Cards" subtitle="View your exam admit cards" /><Skeleton className="h-32 w-full" /></div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Admit Cards" subtitle="View your exam admit cards" />

      {cards.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No admit cards available</CardContent></Card>
      ) : (
        cards.map((card) => {
          const displayDuration = getDynamicDuration(card);
          return (
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
                <Button size="sm" variant="outline" className="mt-2 w-full sm:w-auto" onClick={() => handleDownload(card)}>
                  <Download className="w-4 h-4 mr-2" /> Download Admit Card
                </Button>
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
                    <p className="font-medium">{displayDuration} minutes</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allocated PC</p>
                    <p className="font-medium">{card.systemName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
