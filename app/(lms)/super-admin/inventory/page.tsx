'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Package, Truck, Download, BookOpen, ScrollText, Filter, Search, Trash2, Mail, Phone, Users, Image } from "lucide-react"

export default function InventoryPage() {
    const [institutes, setInstitutes] = useState<any[]>([])
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])

    // Filter States
    const [selectedInstitute, setSelectedInstitute] = useState("all")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedBatch, setSelectedBatch] = useState("all")
    const [searchQuery, setSearchQuery] = useState('')

    const [activeTab, setActiveTab] = useState("books")

    const [students, setStudents] = useState<any[]>([])
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Initial Load
    useEffect(() => {
        fetchInstitutes()
    }, [])

    // Fetch methods
    const fetchInstitutes = async () => {
        const res = await fetch('/api/institutes')
        setInstitutes(await res.json())
    }

    const fetchCourses = async () => {
        if (selectedInstitute === 'all') {
            setCourses([])
            return
        }
        const res = await fetch(`/api/institutes/${selectedInstitute}`)
        const data = await res.json()
        setCourses(data.courses || [])
    }

    const fetchBatches = async () => {
        if (selectedInstitute === 'all' || selectedCourse === 'all') {
            setBatches([])
            return
        }
        const res = await fetch(`/api/batches?instituteId=${selectedInstitute}&courseId=${selectedCourse}`)
        setBatches(await res.json())
    }

    // Cascade Effect
    useEffect(() => {
        if (selectedInstitute !== 'all') {
            fetchCourses()
            setSelectedCourse('all')
            setSelectedBatch('all')
        } else {
            setCourses([])
            setBatches([])
        }
    }, [selectedInstitute])

    useEffect(() => {
        if (selectedCourse !== 'all') {
            fetchBatches()
            setSelectedBatch('all')
        } else {
            setBatches([])
        }
    }, [selectedCourse])

    // Fetch Data on Filter Change
    useEffect(() => {
        // Only fetch if a batch is selected, or maybe just institute? 
        // User asked to behave like student management which lists everything.
        // But Inventory logic in previous code was strictly per batch. 
        // To be safe and performant, I will keep it somewhat strict but maybe allow Institute level? 
        // The previous logic relied on `selectedBatch` to `fetchBookData`.
        // Let's try to be more flexible: Fetch if Institute and Course are active.

        // Reset selections
        setSelectedIds([])

        if (activeTab === 'books') {
            if (selectedInstitute !== 'all' && selectedCourse !== 'all') {
                fetchBookData()
            } else {
                setStudents([])
            }
        } else {
            if (selectedInstitute !== 'all' && selectedCourse !== 'all') {
                fetchCertificateData()
            } else {
                setResults([])
            }
        }
    }, [selectedInstitute, selectedCourse, selectedBatch, activeTab])


    const fetchBookData = async () => {
        setLoading(true)
        try {
            let url = `/api/users?instituteId=${selectedInstitute}&role=student&courseId=${selectedCourse}&royaltyPaid=true`
            if (selectedBatch !== 'all') url += `&batchId=${selectedBatch}`

            const res = await fetch(url)
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : [])
        } finally {
            setLoading(false)
        }
    }

    const fetchCertificateData = async () => {
        setLoading(true)
        try {
            let url = `/api/final-results?instituteId=${selectedInstitute}&courseId=${selectedCourse}` // API might need update to filter by courseId on final-results if not batch
            // The previous code used batchId. Let's see if we can filter by course. 
            // If API doesn't support courseId, we might fetch all for institute and filter client side or just send batchId if selected.
            // Assuming we pass batchId if present.
            if (selectedBatch !== 'all') url += `&batchId=${selectedBatch}`

            const res = await fetch(url)
            const data = await res.json()
            setResults(Array.isArray(data) ? data : [])
        } finally {
            setLoading(false)
        }
    }

    const handleDispatch = async (type: 'book' | 'certificate') => {
        if (selectedIds.length === 0) return toast.error("Select items to dispatch")

        try {
            const res = await fetch('/api/inventory/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    ids: selectedIds,
                    courseId: selectedCourse
                })
            })

            if (res.ok) {
                toast.success(`Marked as Dispatched`)
                setSelectedIds([])
                if (type === 'book') fetchBookData()
                else fetchCertificateData()
            }
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const selectAll = (ids: string[]) => {
        if (selectedIds.length === ids.length) setSelectedIds([])
        else setSelectedIds(ids)
    }

    const getEnrollment = (student: any) => student.courses?.find((c: any) => (c.courseId?._id || c.courseId) === selectedCourse)

    const handleExportCSV = () => {
        if (filteredResults.length === 0) {
            toast.error('No data to export')
            return
        }

        // Get context info
        const selectedInst = institutes.find((i: any) => i._id === selectedInstitute)
        const selectedCrs = courses.find((c: any) => (c.courseId?._id || c.courseId._id) === selectedCourse)
        const selectedBtch = batches.find((b: any) => b._id === selectedBatch)

        const instituteName = selectedInst?.name || 'All Institutes'
        const courseName = selectedCrs?.courseId?.name || 'All Courses'
        const batchName = selectedBtch?.name || 'All Batches'

        // Collect all unique evaluation component names (EXCLUDING "Final Exam")
        const allEvalComponents = new Set<string>()
        filteredResults.forEach(res => {
            res.evaluationMarks?.forEach((m: any) => {
                // Skip if it's named "Final Exam" - we'll handle that separately
                if (!m.name.toLowerCase().includes('final exam')) {
                    allEvalComponents.add(m.name)
                }
            })
        })
        const evalComponentNames = Array.from(allEvalComponents).sort()

        // Check if there are multiple final exams (shouldn't be, but handle gracefully)
        const maxFinalExams = Math.max(...filteredResults.map(res => {
            const finalExams = res.evaluationMarks?.filter((m: any) =>
                m.name.toLowerCase().includes('final exam')
            ) || []
            const hasOnlineScore = res.onlineExamScore !== undefined && res.onlineExamScore !== null ? 1 : 0
            return Math.max(finalExams.length, hasOnlineScore)
        }), 0)

        // Build dynamic headers
        const baseHeaders = ['Sr. No', 'Student Name', 'Mother Name', 'Roll No', 'Aadhaar Number']
        const marksHeaders = [...evalComponentNames]

        // Add Final Exam column(s)
        if (maxFinalExams === 1) {
            marksHeaders.push('Final Exam')
        } else if (maxFinalExams > 1) {
            for (let i = 1; i <= maxFinalExams; i++) {
                marksHeaders.push(`Final Exam ${i}`)
            }
        }

        const summaryHeaders = ['Total Marks', 'Percentage', 'Dispatch Status']
        const headers = [...baseHeaders, ...marksHeaders, ...summaryHeaders]

        // Prepare CSV rows
        const rows = filteredResults.map((res, index) => {
            const aadhaarNo = res.studentId?.aadhaarCardNo || ''
            const baseData = [
                (index + 1).toString(),
                res.studentId?.name || '',
                res.studentId?.motherName || '',
                res.studentId?.rollNo || '',
                aadhaarNo ? `'${aadhaarNo}` : '' // Prepend with single quote to force text format in Excel
            ]

            // Map evaluation marks to their columns (excluding Final Exam)
            const marksData = evalComponentNames.map(componentName => {
                const mark = res.evaluationMarks?.find((m: any) => m.name === componentName)
                return mark ? mark.marksObtained.toString() : '-'
            })

            // Handle Final Exam score(s)
            // Priority: Use onlineExamScore, fallback to evaluationMarks entries
            const finalExamFromEval = res.evaluationMarks?.filter((m: any) =>
                m.name.toLowerCase().includes('final exam')
            ) || []

            if (res.onlineExamScore !== undefined && res.onlineExamScore !== null) {
                // Use the onlineExamScore (single canonical source)
                marksData.push(res.onlineExamScore.toString())
            } else if (finalExamFromEval.length > 0) {
                // Fallback: use from evaluationMarks
                finalExamFromEval.forEach((fe: any) => {
                    marksData.push(fe.marksObtained.toString())
                })
                // Fill remaining if needed
                for (let i = finalExamFromEval.length; i < maxFinalExams; i++) {
                    marksData.push('-')
                }
            } else {
                // No final exam data
                for (let i = 0; i < maxFinalExams; i++) {
                    marksData.push('-')
                }
            }

            // Calculate total marks correctly
            let calculatedTotal = 0

            // Sum evaluation marks (excluding Final Exam entries)
            res.evaluationMarks?.forEach((m: any) => {
                if (!m.name.toLowerCase().includes('final exam')) {
                    calculatedTotal += m.marksObtained || 0
                }
            })

            // Add final exam score
            if (res.onlineExamScore !== undefined && res.onlineExamScore !== null) {
                calculatedTotal += res.onlineExamScore
            } else if (finalExamFromEval.length > 0) {
                finalExamFromEval.forEach((fe: any) => {
                    calculatedTotal += fe.marksObtained || 0
                })
            }

            // Summary data
            const summaryData = [
                calculatedTotal.toString(),
                res.percentage ? `${res.percentage}%` : '-',
                res.certificateDispatched ? 'Dispatched' : 'Pending'
            ]

            return [...baseData, ...marksData, ...summaryData]
        })

        // Create CSV content with context header
        const csvLines = [
            // Context Information
            `Institute,"${instituteName}"`,
            `Course,"${courseName}"`,
            `Batch,"${batchName}"`,
            `Export Date,"${new Date().toLocaleDateString()}"`,
            `Total Students,"${filteredResults.length}"`,
            '', // Empty line
            // Column Headers
            headers.join(','),
            // Data Rows
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ]

        const csvContent = csvLines.join('\n')

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)

        // Better filename with context
        const filename = `${instituteName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_Certificates_${new Date().toISOString().split('T')[0]}.csv`
        link.setAttribute('download', filename)

        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('CSV exported successfully')
    }

    // Download Photos as ZIP
    const handleDownloadPhotos = async () => {
        console.log('=== Download Photos Clicked ===')
        console.log('Filtered Results:', filteredResults.length)

        if (filteredResults.length === 0) {
            toast.error('No students to download photos for')
            return
        }

        const studentsWithPhotos = filteredResults.filter(res => res.studentId?.documents?.photo)
        console.log('Students with photos:', studentsWithPhotos.length)

        if (studentsWithPhotos.length === 0) {
            toast.error('No student photos available')
            return
        }

        toast.info(`Preparing to download ${studentsWithPhotos.length} photos...`)

        try {
            console.log('Importing JSZip...')
            // Dynamically import JSZip
            const JSZip = (await import('jszip')).default
            console.log('JSZip imported successfully:', !!JSZip)
            const zip = new JSZip()

            let successCount = 0
            let failedStudents: string[] = []
            const usedFilenames = new Set<string>()

            // Fetch and add each photo to ZIP
            const photoPromises = studentsWithPhotos.map(async (res, index) => {
                const student = res.studentId
                const photoUrl = student.documents?.photo

                if (!photoUrl) {
                    failedStudents.push(student.name)
                    return
                }

                try {
                    // Fetch with timeout
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 15000)
                    const response = await fetch(photoUrl, { signal: controller.signal })
                    clearTimeout(timeoutId)

                    if (!response.ok) throw new Error(`HTTP ${response.status}`)
                    const blob = await response.blob()

                    // Verify image type
                    if (!blob.type.startsWith('image/')) {
                        failedStudents.push(student.name)
                        return
                    }

                    // Clean filename
                    let studentName = student.name.trim()
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .replace(/\s+/g, '_')
                        .substring(0, 50)
                    const rollNo = (student.rollNo || `Student${index + 1}`).replace(/[^a-zA-Z0-9]/g, '_')

                    // Get proper extension
                    let ext = 'jpg'
                    if (blob.type === 'image/png') ext = 'png'
                    else if (blob.type === 'image/jpeg') ext = 'jpg'
                    else if (blob.type === 'image/webp') ext = 'webp'

                    // Handle duplicate filenames
                    let filename = `${studentName}_${rollNo}.${ext}`
                    let counter = 1
                    while (usedFilenames.has(filename)) {
                        filename = `${studentName}_${rollNo}_${counter}.${ext}`
                        counter++
                    }
                    usedFilenames.add(filename)

                    zip.file(filename, blob)
                    successCount++
                } catch (err) {
                    console.error(`Failed: ${student.name}`, err)
                    failedStudents.push(student.name)
                }
            })

            await Promise.all(photoPromises)

            if (successCount === 0) {
                toast.error('Failed to download any photos')
                return
            }

            // Generate ZIP with compression
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            })

            // Download ZIP
            const link = document.createElement('a')
            const url = URL.createObjectURL(zipBlob)
            link.setAttribute('href', url)

            const selectedInst = institutes.find((i: any) => i._id === selectedInstitute)
            const selectedCrs = courses.find((c: any) => (c.courseId?._id || c.courseId) === selectedCourse)
            const instituteName = (selectedInst?.name || 'All_Institutes').replace(/[^a-zA-Z0-9]/g, '_')
            const courseName = (selectedCrs?.courseId?.name || selectedCrs?.name || 'All_Courses').replace(/[^a-zA-Z0-9]/g, '_')

            const filename = `${instituteName}_${courseName}_Photos_${new Date().toISOString().split('T')[0]}.zip`
            link.setAttribute('download', filename)

            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            // Show detailed result
            if (failedStudents.length > 0) {
                toast.warning(`Downloaded ${successCount} of ${studentsWithPhotos.length} photos. ${failedStudents.length} failed.`)
                console.log('Failed students:', failedStudents)
            } else {
                toast.success(`Successfully downloaded all ${successCount} photos!`)
            }
        } catch (error) {
            console.error('Error creating ZIP:', error)
            toast.error('Failed to create photo archive')
        }
    }

    // Client-side filtering for Search Query
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const filteredResults = results.filter(res =>
        res.studentId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.rollNo && res.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) // Assuming Result may have rollNo populated or join
    )

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <SectionHeader title="Inventory Management" subtitle="Manage dispatch of books and certificates" />

                <div className="flex justify-center w-full">
                    <AnimatedTabsProfessional
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: "books", label: "Books / Study Material", count: filteredStudents.length },
                            { id: "certificates", label: "Certificates", count: filteredResults.length },
                        ]}
                    />
                </div>
            </div>

            {/* Filter Bar - Sticky & Structured like Student Management */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Search & Filter</h3>
                    </div>
                    {(searchQuery || selectedInstitute !== 'all' || selectedCourse !== 'all' || selectedBatch !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => { setSearchQuery(''); setSelectedInstitute('all'); setSelectedCourse('all'); setSelectedBatch('all'); }}
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
                            placeholder="Search by student name, roll no, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 focus:bg-background transition-colors"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-background/50">
                                <SelectValue placeholder="Select Institute" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select Institute</SelectItem>
                                {institutes.map(i => <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={selectedInstitute === 'all'}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-background/50">
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select Course</SelectItem>
                                {courses.map((c: any) => (
                                    <SelectItem key={c._id || c.courseId._id} value={c.courseId._id}>{c.courseId.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={selectedCourse === 'all'}>
                            <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                                <SelectValue placeholder="Select Batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Batches</SelectItem>
                                {batches.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === "books" && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-4">
                        {/* Actions */}
                        {filteredStudents.length > 0 && (
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => handleDispatch('book')} className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                                    <Truck className="w-4 h-4" /> Mark {selectedIds.length} Dispatched
                                </Button>
                            </div>
                        )}

                        {/* Student Table */}
                        <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            {filteredStudents.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground bg-muted/20 border-dashed m-2 rounded-lg border">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium text-foreground">No students found</p>
                                    <p className="text-sm">Select an Institute and Course to view students</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12 pl-4"><Checkbox onCheckedChange={() => selectAll(filteredStudents.map(s => s._id))} checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} /></TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Contact Info</TableHead>
                                            <TableHead>Books Included</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map(student => {
                                            const enroll = getEnrollment(student)
                                            const isDispatched = enroll?.booksDispatched
                                            return (
                                                <TableRow key={student._id} className="group hover:bg-muted/30 transition-colors">
                                                    <TableCell className="pl-4"><Checkbox checked={selectedIds.includes(student._id)} onCheckedChange={() => toggleSelection(student._id)} /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-2 ring-background overflow-hidden relative">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm text-foreground">{student.name}</p>
                                                                <p className="text-xs text-muted-foreground">{student.motherName || 'No Mother Name'}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground border-muted-foreground/20">
                                                            {student.rollNo || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Mail className="w-3 h-3 text-primary/70" />
                                                                <span className="truncate max-w-[150px]">{student.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Phone className="w-3 h-3 text-primary/70" />
                                                                <span>{student.phone || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {enroll?.booksIncluded ?
                                                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Yes</Badge> :
                                                            <Badge variant="outline">No</Badge>
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {isDispatched ?
                                                            <Badge className="bg-green-500 hover:bg-green-600">Dispatched</Badge> :
                                                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Pending</Badge>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === "certificates" && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-4">
                        {/* Actions */}
                        {filteredResults.length > 0 && (
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                                    <Download className="w-4 h-4" /> Export CSV
                                </Button>
                                <Button variant="outline" className="gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200" onClick={handleDownloadPhotos}>
                                    <Image className="w-4 h-4" /> Download Photos
                                </Button>
                                <Button variant="outline" onClick={() => handleDispatch('certificate')} className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                                    <Truck className="w-4 h-4" /> Mark {selectedIds.length} Dispatched
                                </Button>
                            </div>
                        )}

                        {/* Results Table */}
                        <div className="border rounded-xl bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            {filteredResults.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground bg-muted/20 border-dashed m-2 rounded-lg border">
                                    <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium text-foreground">No students found</p>
                                    <p className="text-sm">Select an Institute and Course to view certificates</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12 pl-4"><Checkbox onCheckedChange={() => selectAll(filteredResults.map(r => r._id))} checked={selectedIds.length === filteredResults.length && filteredResults.length > 0} /></TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Mother's Name</TableHead>
                                            <TableHead>Marks Details</TableHead>
                                            <TableHead>Percentage</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.map(res => {
                                            // Filter out "Final Exam" from evaluationMarks to prevent duplicates
                                            const evalMarks = res.evaluationMarks
                                                .filter((m: any) => !m.name.toLowerCase().includes('final exam'))
                                                .map((m: any) => `${m.name}: ${m.marksObtained}`)

                                            // Add Final Exam score separately (single source of truth)
                                            const marksDisplay = [
                                                ...evalMarks,
                                                res.onlineExamScore !== undefined && res.onlineExamScore !== null
                                                    ? `Final Exam: ${res.onlineExamScore}`
                                                    : null
                                            ].filter(Boolean).join(', ');

                                            return (
                                                <TableRow key={res._id} className="group hover:bg-muted/30 transition-colors">
                                                    <TableCell className="pl-4"><Checkbox checked={selectedIds.includes(res._id)} onCheckedChange={() => toggleSelection(res._id)} /></TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shadow-sm ring-2 ring-background">
                                                                {res.studentId?.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span>{res.studentId?.name}</span>
                                                                <span className="text-xs text-muted-foreground">{res.studentId?.role === 'student' ? 'Student' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{res.studentId?.motherName || '---'}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={marksDisplay}>
                                                        {marksDisplay}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-foreground">{res.percentage}%</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {res.certificateDispatched ?
                                                            <Badge className="bg-green-500 hover:bg-green-600">Dispatched</Badge> :
                                                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Pending</Badge>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}
