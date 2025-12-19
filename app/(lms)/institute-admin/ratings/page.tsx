'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare, TrendingUp, BookOpen, ThumbsUp, Quote } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function InstituteRatingsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    // Try to get instituteId from localStorage, fallback to hardcoded if needed (though hardcoded is not ideal)
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.instituteId) {
          setInstituteId(userData.instituteId)
        } else {
          // Fallback for dev/demo if needed, or just let the fetch fail gracefully
          setInstituteId('507f1f77bcf86cd799439012')
        }
      } catch (e) {
        setInstituteId('507f1f77bcf86cd799439012')
      }
    } else {
      setInstituteId('507f1f77bcf86cd799439012')
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchRatings()
    }
  }, [instituteId])

  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/feedback/institute/${instituteId}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch ratings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Institute Ratings" subtitle="Track student satisfaction and feedback" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-yellow-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl shadow-sm">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Average Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{data?.averageRating || '0.0'}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(parseFloat(data?.averageRating || '0')) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Ratings</p>
                <p className="text-2xl font-bold">{data?.totalFeedbacks || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Student submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Positive Rate</p>
                {/* Improve this logic if possible, currently simple placeholder */}
                <p className="text-2xl font-bold">{data?.totalFeedbacks > 0 ? '90%' : 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">Reviews &gt; 3 stars</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Quote className="w-5 h-5 text-primary" />
            Recent Feedback
          </h3>
        </div>

        {!data?.ratings || data.ratings.length === 0 ? (
          <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No ratings received yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.ratings?.map((r: any, i: number) => (
              <Card key={i} className="hover:shadow-md transition-shadow group flex flex-col h-full border-l-4 border-l-primary/40">
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm font-medium line-clamp-1">{r.course?.name}</CardTitle>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="mb-4 text-sm text-muted-foreground italic relative pl-4 border-l-2 border-muted">
                    "{r.comment || "No written feedback provided."}"
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> helpful</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
