'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SimpleLineChart } from "@/components/lms/widgets"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" - Removed
import { toast } from "sonner"
import { FileText, TrendingUp, Building2, Users, IndianRupee, Download, BarChart3, BookOpen, GraduationCap, Award, Target } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("financial")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      const reportData = await res.json()
      setData(reportData)
    } catch (error) {
      toast.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`
    return `₹${amount.toLocaleString()}`
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
  if (!data) return <div>No data available</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            Global Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive analytics and insights</p>
        </div>
        <Button className="gap-2"><Download className="w-4 h-4" />Generate Custom Report</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatAmount(data.overview.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Institutes</p>
                <p className="text-2xl font-bold">{data.overview.totalInstitutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{data.overview.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{data.overview.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                <p className="text-2xl font-bold">{data.overview.avgPassRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center w-full pb-4">
          <AnimatedTabsProfessional
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "financial", label: "Financial Reports" },
              { id: "enrollment", label: "Enrollment Analytics" },
              { id: "performance", label: "Performance Metrics" },
              { id: "institutes", label: "Institute Performance" },
            ]}
          />
        </div>

        {activeTab === "financial" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Revenue Trends (Last 6 Months)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <SimpleLineChart data={data.financial.revenueTrends} height={200} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle>Financial P&L Statement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="font-medium">Total Income</span>
                      <span className="text-xl font-bold text-green-600">{formatAmount(data.financial.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="font-medium">Total Expenses</span>
                      <span className="text-xl font-bold text-red-600">{formatAmount(data.financial.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-lg border-2 border-green-500">
                      <span className="text-lg font-bold">Net Profit</span>
                      <span className="text-2xl font-bold text-green-600">{formatAmount(data.financial.netProfit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "enrollment" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Student Enrollment Trends</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <SimpleLineChart data={data.enrollment.trends} height={200} />
                  <p className="text-sm text-muted-foreground mt-4">Total active students: {data.overview.totalStudents}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Course-wise Enrollment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {data.enrollment.courseWise.map((course: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="font-medium">{course.name}</span>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-lg font-semibold text-blue-600">{course.students}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total DPPs</p>
                      <p className="text-2xl font-bold">{data.exams.totalDPPs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Final Exams</p>
                      <p className="text-2xl font-bold">{data.exams.totalFinalExams}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attempts</p>
                      <p className="text-2xl font-bold">{data.exams.totalAttempts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold">{data.exams.avgScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "institutes" && (
          <div className="space-y-4">

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Institute Comparison</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {data.institutes.map((inst: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-blue-500">
                      <span className="font-medium text-lg">{inst.name}</span>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <span className="text-green-600 font-semibold text-lg">{formatAmount(inst.revenue)}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Students</p>
                          <span className="text-blue-600 font-semibold text-lg">{inst.students}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Pass Rate</p>
                          <span className="text-emerald-600 font-semibold text-lg">{inst.passRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
