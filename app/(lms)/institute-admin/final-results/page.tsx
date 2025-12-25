'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Users, Calendar, ArrowRight, Filter, Search, Trash2 } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function FinalResultsPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [instituteId, setInstituteId] = useState<string | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCourse, setFilterCourse] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.instituteId) {
            setInstituteId(user.instituteId)
        }
    }, [])

    useEffect(() => {
        if (instituteId) {
            fetchCourses()
            fetchBatches()
        }
    }, [instituteId])

    const fetchCourses = async () => {
        try {
            const res = await fetch(`/api/institutes/${instituteId}`)
            const data = await res.json()
            setCourses(data.courses || [])
        } catch (error) {
            console.error("Failed to fetch courses")
        } finally {
            setLoading(false)
        }
    }

    const fetchBatches = async () => {
        try {
            const res = await fetch(`/api/batches?instituteId=${instituteId}`)
            const data = await res.json()
            setBatches(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch batches")
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>

    // Filter Logic
    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCourse = filterCourse === 'all' || (batch.courseId?._id || batch.courseId) === filterCourse
        const matchesStatus = filterStatus === 'all' || batch.status === filterStatus
        return matchesSearch && matchesCourse && matchesStatus
    })

    return (
        <div className="space-y-6 p-6 pb-20">
            <SectionHeader
                title="Final Results Processing"
                subtitle="Calculate marks, finalize results, and submit to Super Admin"
            />

            {/* Structured Filter Bar (Matching Student Management Design) */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Search & Filter Batches</h3>
                    </div>
                    {(searchQuery || filterCourse !== 'all' || filterStatus !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => { setSearchQuery(''); setFilterCourse('all'); setFilterStatus('all') }}
                        >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search batch name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 focus:bg-background transition-colors"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={filterCourse} onValueChange={setFilterCourse}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-background/50">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map((ca: any) => (
                                    <SelectItem key={ca.courseId._id} value={ca.courseId._id}>
                                        {ca.courseId.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[150px] bg-background/50">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground pt-1">
                    <p>Showing <strong>{filteredBatches.length}</strong> of <strong>{batches.length}</strong> batches</p>
                </div>
            </div>

            {filteredBatches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 border-dashed rounded-xl border">
                    No batches found matching your criteria.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBatches.map((batch) => (
                        <Card
                            key={batch._id}
                            className="group cursor-pointer hover:shadow-lg transition-all border-muted/60 relative overflow-hidden"
                            onClick={() => router.push(`/institute-admin/final-results/${batch._id}`)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{batch.name}</h3>
                                        <p className="text-xs text-muted-foreground">{new Date(batch.startDate).getFullYear()} Batch</p>
                                    </div>
                                    <Badge variant={batch.status === 'Active' ? 'default' : 'secondary'}>
                                        {batch.status}
                                    </Badge>
                                </div>

                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Ends: {new Date(batch.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>Total Students Enrolled</span>
                                        {/* Ideally we show count, but simple display is fine for now */}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center text-primary font-medium text-sm group-hover:underline">
                                    Process Results <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
