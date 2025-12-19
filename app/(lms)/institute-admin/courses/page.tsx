'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { BookOpen, IndianRupee, TrendingUp, Edit, AlertCircle, CheckCircle2, Package, Truck, ArrowRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Loader from "@/components/ui/loader"

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [pricingForm, setPricingForm] = useState({ institutePrice: 0 })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchCourses()
    }
  }, [instituteId])

  useEffect(() => {
    if (selectedCourse) {
      const basePrice = (selectedCourse.courseId?.baseFee || 0) + (selectedCourse.courseId?.examFee || 0)
      setPricingForm({
        institutePrice: selectedCourse.institutePrice || basePrice
      })
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/institutes/${instituteId}`)
      const institute = await res.json()
      setCourses(institute.courses || [])
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handlePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    const basePrice = (selectedCourse.courseId.baseFee || 0) + (selectedCourse.courseId.examFee || 0)

    if (pricingForm.institutePrice < basePrice) {
      toast.error(`Price must be >= ₹${basePrice.toLocaleString()} (base + exam fee)`)
      return
    }

    try {
      const res = await fetch(`/api/institutes/${instituteId}/course-pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseAssignmentId: selectedCourse._id,
          institutePrice: Number(pricingForm.institutePrice)
        })
      })
      if (res.ok) {
        toast.success('Pricing updated successfully')
        setEditOpen(false)
        fetchCourses()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to update pricing')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalCourses = courses.length
  const avgProfit = courses.length > 0 ? Math.round(courses.reduce((sum: number, c: any) => {
    const basePrice = (c.courseId?.baseFee || 0) + (c.courseId?.examFee || 0)
    const institutePrice = c.institutePrice || basePrice
    return sum + (institutePrice - basePrice)
  }, 0) / courses.length) : 0

  const totalProjectedProfit = avgProfit * totalCourses // Simple projection

  return (
    <div className="space-y-8 p-6 pb-20">
      <SectionHeader title="Course Management" subtitle="Manage pricing, margins, and improved profitability" />

      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-inner">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-inner">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Profit/Course</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{avgProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-inner">
                <IndianRupee className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Potential</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{totalProjectedProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {courses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 py-24 text-center border-2 border-dashed rounded-xl bg-muted/30">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Courses Assigned</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Contact the super admin to get courses assigned to your institute.
            </p>
          </div>
        ) : (
          courses.map((courseAssignment: any) => {
            const course = courseAssignment.courseId
            if (!course) return null

            const baseFee = course?.baseFee || 0
            const examFee = course?.examFee || 0
            const bookPrice = course?.bookPrice || 0
            const deliveryCharge = course?.deliveryCharge || 0

            const basePrice = baseFee + examFee
            const institutePrice = courseAssignment.institutePrice || basePrice
            const profit = institutePrice - basePrice
            const profitPercentage = basePrice > 0 ? Math.round((profit / basePrice) * 100) : 0

            return (
              <Card key={courseAssignment._id} className="group hover:shadow-lg transition-all border-muted/60 overflow-hidden flex flex-col">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50 border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge variant="outline" className="mb-2 bg-white dark:bg-gray-800 text-xs font-normal">
                        {course.code}
                      </Badge>
                      <CardTitle className="line-clamp-1 text-lg">{course.name}</CardTitle>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 space-y-6">
                  {/* Financials Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Base Cost</p>
                      <p className="font-medium text-lg">₹{basePrice.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Selling Price</p>
                      <p className="font-bold text-lg text-primary">₹{institutePrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Profit Margin</span>
                      <span className={`font-semibold ${profit > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        +₹{profit.toLocaleString()} ({profitPercentage}%)
                      </span>
                    </div>
                    <Progress value={Math.min(profitPercentage, 100)} className="h-2" />
                  </div>

                  <div className="pt-4 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3" />
                      <span>Books: ₹{bookPrice}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-3 h-3" />
                      <span>Delivery: ₹{deliveryCharge}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50/50 dark:bg-gray-900/30 p-4 border-t">
                  <Button
                    className="w-full group-hover:bg-primary/90 transition-colors shadow-sm"
                    variant="default"
                    onClick={() => {
                      setSelectedCourse(courseAssignment)
                      setEditOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Manage Pricing
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 bg-muted/30">
            <DialogTitle className="text-xl">Pricing Strategy</DialogTitle>
            <DialogDescription>
              Set the selling price for <span className="text-foreground font-medium">{selectedCourse?.courseId?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-8">
            {selectedCourse && (() => {
              const baseFee = (selectedCourse.courseId?.baseFee || 0)
              const examFee = (selectedCourse.courseId?.examFee || 0)
              const baseTotal = baseFee + examFee
              const currentProfit = Math.max(0, pricingForm.institutePrice - baseTotal)

              return (
                <div className="space-y-6">
                  {/* Cost Structure Visual */}
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="p-4 grid grid-cols-3 gap-4 text-center divide-x bg-muted/20">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Base Fee</p>
                        <p className="font-semibold">₹{baseFee.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Exam Fee</p>
                        <p className="font-semibold">₹{examFee.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1 bg-blue-50/50 dark:bg-blue-900/10 -m-4 p-4 flex flex-col justify-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Base Cost</p>
                        <p className="font-bold text-lg text-blue-700 dark:text-blue-300">₹{baseTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 pt-2">
                    <div className="space-y-3">
                      <Label htmlFor="institutePrice" className="text-base">Your Selling Price to Students</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="institutePrice"
                          type="number"
                          className="pl-9 text-lg h-12"
                          value={pricingForm.institutePrice}
                          onChange={(e) => setPricingForm({ ...pricingForm, institutePrice: Number(e.target.value) })}
                          min={baseTotal}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * Students will be charged this amount + optional book/delivery fees if selected.
                      </p>
                    </div>

                    {/* Profit Projection */}
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Projected Profit per Student</p>
                          <p className="text-xs text-green-700 dark:text-green-400">Calculated based on your selling price</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          +₹{currentProfit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <DialogFooter className="p-6 pt-2 bg-gray-50/50 dark:bg-gray-900/30 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handlePricing} className="bg-primary shadow-lg shadow-primary/25">Save Pricing Strategy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
