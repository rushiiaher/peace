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
      const royalty = (selectedCourse.courseId?.examFee || 0) + (selectedCourse.courseId?.certificateCharge || 0)
      const suggestedPrice = (selectedCourse.courseId?.baseFee || 0) + royalty
      setPricingForm({
        institutePrice: selectedCourse.institutePrice || suggestedPrice
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
    const royalty = (selectedCourse.courseId?.examFee || 0) + (selectedCourse.courseId?.certificateCharge || 0)

    if (pricingForm.institutePrice < royalty) {
      toast.error(`Price must be >= ₹${royalty.toLocaleString()} (Royalty amount)`)
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
    const royalty = (c.courseId?.examFee || 0) + (c.courseId?.certificateCharge || 0)
    const suggestedPrice = (c.courseId?.baseFee || 0) + royalty
    const institutePrice = c.institutePrice || suggestedPrice
    return sum + (institutePrice - royalty)
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
            const certCharge = course?.certificateCharge || 0
            const bookPrice = course?.bookPrice || 0
            const deliveryCharge = course?.deliveryCharge || 0

            const royalty = examFee + certCharge
            const suggestedPrice = baseFee + royalty
            const institutePrice = courseAssignment.institutePrice || suggestedPrice
            const profit = institutePrice - royalty
            const profitPercentage = royalty > 0 ? Math.round((profit / royalty) * 100) : 100

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
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Royalty (Costs)</p>
                      <p className="font-medium text-lg">₹{royalty.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Price</p>
                      <p className="font-bold text-lg text-primary">₹{institutePrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Institute Profit</span>
                      <span className={`font-semibold ${profit > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        +₹{profit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={Math.min(profitPercentage / 2, 100)} className="h-2" />
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
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Pricing Strategy
            </DialogTitle>
            <DialogDescription>
              Configure the fee structure for <span className="text-foreground font-medium">{selectedCourse?.courseId?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            {selectedCourse && (() => {
              const examFee = (selectedCourse.courseId?.examFee || 0)
              const certCharge = (selectedCourse.courseId?.certificateCharge || 0)
              const royalty = examFee + certCharge

              const bookPrice = (selectedCourse.courseId?.bookPrice || 0)
              const deliveryCharge = (selectedCourse.courseId?.deliveryCharge || 0)
              const materialCost = bookPrice // Delivery is per batch, not per student

              const currentProfit = Math.max(0, pricingForm.institutePrice - royalty)

              return (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column: Cost Breakdown */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" /> Fixed Costs (Royalty)
                      </h4>
                      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Exam Fee</span>
                          <span className="font-medium">₹{examFee.toLocaleString()}</span>
                        </div>
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Certificate Charge</span>
                          <span className="font-medium">₹{certCharge.toLocaleString()}</span>
                        </div>
                        <div className="p-3 bg-orange-50/50 dark:bg-orange-900/10 flex justify-between items-center">
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Total Royalty / Student</span>
                          <span className="font-bold text-lg text-orange-700 dark:text-orange-300">₹{royalty.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" /> Optional Costs
                      </h4>
                      <div className="bg-card border rounded-xl overflow-hidden shadow-sm mb-3">
                        <div className="p-3 border-b bg-muted/20 flex justify-between text-sm">
                          <span className="text-muted-foreground">Books & Study Material</span>
                          <span className="font-medium">₹{bookPrice.toLocaleString()}</span>
                        </div>
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 flex justify-between items-center">
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Student Book Cost</span>
                          <span className="font-bold text-lg text-blue-700 dark:text-blue-300">₹{materialCost.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-xs text-yellow-800 dark:text-yellow-400">
                        <Truck className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Batch Delivery Charge</p>
                          <p>₹{deliveryCharge.toLocaleString()} (One-time fee per batch order)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pricing Input & Preview */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="institutePrice" className="text-base font-semibold">Set Base Course Fee</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="institutePrice"
                          type="number"
                          className="pl-9 text-lg h-12 shadow-sm border-primary/20 focus-visible:ring-primary/30"
                          value={pricingForm.institutePrice}
                          onChange={(e) => setPricingForm({ ...pricingForm, institutePrice: Number(e.target.value) })}
                          min={royalty}
                          placeholder="Enter tuition fee..."
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This is your tuition fee. It must cover the royalty (₹{royalty}) at minimum.
                      </p>
                    </div>

                    {/* Pricing Preview Table */}
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                      <div className="bg-muted/40 p-3 border-b">
                        <h4 className="text-sm font-medium text-center">Student Pricing Preview</h4>
                      </div>
                      <div className="divide-y">
                        <div className="p-3 flex justify-between items-center bg-white dark:bg-card">
                          <div>
                            <p className="font-medium text-sm">Tuition Only</p>
                            <p className="text-[10px] text-muted-foreground">Base Fee</p>
                          </div>
                          <span className="font-bold text-lg">₹{pricingForm.institutePrice.toLocaleString()}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/10">
                          <div>
                            <p className="font-medium text-sm text-blue-900 dark:text-blue-200">Tuition + Books</p>
                            <p className="text-[10px] text-blue-700/70 dark:text-blue-300/70">Base Fee + Books</p>
                          </div>
                          <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                            ₹{(pricingForm.institutePrice + materialCost).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profit Display */}
                    <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-200 dark:bg-green-900/50 rounded-full text-green-700 dark:text-green-300">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800 dark:text-green-200">Net Profit / Student</p>
                          <p className="text-xs text-green-700 dark:text-green-400">After royalty deduction</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300 flex items-center">
                        +₹{currentProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <DialogFooter className="p-6 pt-4 bg-gray-50/50 dark:bg-gray-900/30 border-t">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handlePricing} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8">Save Pricing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
