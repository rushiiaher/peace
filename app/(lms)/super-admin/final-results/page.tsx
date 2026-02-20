'use client'

import { useState, useEffect, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
    Search, Download, RefreshCw, GraduationCap, Users, Award, TrendingUp,
    Building2, BookOpen, Filter, X
} from 'lucide-react'
import Loader from '@/components/ui/loader'

// ── Grade helper ──────────────────────────────────────────────────────────────
function getGrade(total: number, hasResult: boolean): string {
    if (!hasResult) return '-'
    if (total >= 273) return 'A+'
    if (total >= 243) return 'A'
    if (total >= 213) return 'B+'
    if (total >= 183) return 'B'
    if (total >= 151) return 'C+'
    if (total >= 135) return 'D'
    return 'F'
}

const gradeColor: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'A': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'B+': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'B': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    'C+': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'D': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'F': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '-': 'bg-muted text-muted-foreground',
}

export default function FinalResultsPage() {
    // ── Data state ───────────────────────────────────────────────────────────
    const [institutes, setInstitutes] = useState<any[]>([])
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [results, setResults] = useState<any[]>([])

    // ── Filter state ─────────────────────────────────────────────────────────
    const [selectedInstitute, setSelectedInstitute] = useState('all')
    const [selectedCourse, setSelectedCourse] = useState('all')
    const [selectedBatch, setSelectedBatch] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    // ── Loading state ─────────────────────────────────────────────────────────
    const [loadingResults, setLoadingResults] = useState(false)
    const [loadingInstitutes, setLoadingInstitutes] = useState(true)

    // ── Fetch Institutes on mount ─────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/institutes')
            .then(r => r.json())
            .then(d => setInstitutes(Array.isArray(d) ? d : []))
            .catch(() => toast.error('Failed to load institutes'))
            .finally(() => setLoadingInstitutes(false))
    }, [])

    // ── Fetch Courses when institute changes ─────────────────────────────────
    useEffect(() => {
        setCourses([])
        setSelectedCourse('all')
        setBatches([])
        setSelectedBatch('all')
        if (selectedInstitute === 'all') return
        fetch(`/api/institutes/${selectedInstitute}/courses`)
            .then(r => r.json())
            .then(d => setCourses(Array.isArray(d) ? d : []))
            .catch(() => toast.error('Failed to load courses'))
    }, [selectedInstitute])

    // ── Fetch Batches when course changes ────────────────────────────────────
    useEffect(() => {
        setBatches([])
        setSelectedBatch('all')
        if (selectedInstitute === 'all' || selectedCourse === 'all') return
        fetch(`/api/batches?instituteId=${selectedInstitute}&courseId=${selectedCourse}`)
            .then(r => r.json())
            .then(d => setBatches(Array.isArray(d) ? d : []))
            .catch(() => toast.error('Failed to load batches'))
    }, [selectedCourse, selectedInstitute])

    // ── Fetch Results ─────────────────────────────────────────────────────────
    const fetchResults = async () => {
        setLoadingResults(true)
        setResults([])
        try {
            let url = '/api/final-results?'
            if (selectedInstitute !== 'all') url += `instituteId=${selectedInstitute}&`
            if (selectedCourse !== 'all') url += `courseId=${selectedCourse}&`
            if (selectedBatch !== 'all') url += `batchId=${selectedBatch}&`

            const res = await fetch(url)
            const data = await res.json()

            if (!res.ok) {
                console.error('Final results error:', data)
                toast.error(data?.details || 'Failed to fetch results')
                return
            }
            setResults(Array.isArray(data) ? data : [])
        } catch (e) {
            toast.error('Network error fetching results')
        } finally {
            setLoadingResults(false)
        }
    }

    // Auto-fetch when filters change
    useEffect(() => {
        fetchResults()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInstitute, selectedCourse, selectedBatch])

    // ── Filtered + searched results ───────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = results

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter((r: any) => {
                const name = r.studentId?.name?.toLowerCase() || ''
                const rollNo = r.studentId?.rollNo?.toLowerCase() || ''
                const email = r.studentId?.email?.toLowerCase() || ''
                return name.includes(q) || rollNo.includes(q) || email.includes(q)
            })
        }

        // Date range filter (based on result createdAt)
        if (dateFrom) {
            const from = new Date(dateFrom).getTime()
            list = list.filter((r: any) => new Date(r.createdAt).getTime() >= from)
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime() + 86400000 // include full day
            list = list.filter((r: any) => new Date(r.createdAt).getTime() <= to)
        }

        return list
    }, [results, searchQuery, dateFrom, dateTo])

    // ── Summary Stats — all driven by the filtered list ──────────────────────
    const stats = useMemo(() => {
        const total = filtered.length
        // Only students with an actual submitted result count towards pass/fail/avg
        const withResult = filtered.filter((r: any) => r.percentage != null)
        const passed = withResult.filter((r: any) => Number(r.percentage) >= 45).length
        const failed = withResult.length - passed
        const avgPct = withResult.length > 0
            ? (withResult.reduce((sum: number, r: any) => sum + Number(r.percentage), 0) / withResult.length).toFixed(1)
            : '0'
        return { total, passed, failed, avgPct }
    }, [filtered])

    // ── CSV Export ────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (filtered.length === 0) { toast.error('No results to export'); return }

        const headers = [
            'Sr. No', 'Student Name', 'Roll No', 'Mother Name',
            'Institute', 'Course', 'Batch', 'Percentage', 'Result Date'
        ]

        const rows = filtered.map((r: any, i: number) => {
            return [
                (i + 1).toString(),
                r.studentId?.name || '-',
                r.studentId?.rollNo || '-',
                r.studentId?.motherName || '-',
                r.instituteId?.name || '-',
                r.courseId?.name || '-',
                r.batchId?.name || '-',
                r.percentage != null ? `${r.percentage}%` : '-',
                r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '-',
            ]
        })

        const csvContent = [headers, ...rows]
            .map(row => row.map((c: string) => `"${c}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        const instName = institutes.find(i => i._id === selectedInstitute)?.name || 'All'
        a.download = `final-results_${instName}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast.success(`Exported ${filtered.length} records`)
    }

    const clearFilters = () => {
        setSelectedInstitute('all')
        setSelectedCourse('all')
        setSelectedBatch('all')
        setSearchQuery('')
        setDateFrom('')
        setDateTo('')
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-indigo-600" />
                        Final Results
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and export final exam results across all institutes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchResults} disabled={loadingResults}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingResults ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Results</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Passed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <X className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Failed</p>
                            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Avg %</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.avgPct}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {/* Institute */}
                        <div className="xl:col-span-1">
                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Institute
                            </label>
                            <Select value={selectedInstitute} onValueChange={setSelectedInstitute} disabled={loadingInstitutes}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All Institutes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Institutes</SelectItem>
                                    {institutes.map((i: any) => (
                                        <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Course */}
                        <div className="xl:col-span-1">
                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> Course
                            </label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                                disabled={selectedInstitute === 'all' || courses.length === 0}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={selectedInstitute === 'all' ? 'Select institute first' : 'All Courses'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((c: any) => (
                                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Batch */}
                        <div className="xl:col-span-1">
                            <label className="text-xs text-muted-foreground mb-1">Batch</label>
                            <Select
                                value={selectedBatch}
                                onValueChange={setSelectedBatch}
                                disabled={selectedCourse === 'all' || batches.length === 0}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={selectedCourse === 'all' ? 'Select course first' : 'All Batches'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Batches</SelectItem>
                                    {batches.map((b: any) => (
                                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="xl:col-span-1">
                            <label className="text-xs text-muted-foreground mb-1">Date From</label>
                            <Input
                                type="date"
                                className="h-9"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="xl:col-span-1">
                            <label className="text-xs text-muted-foreground mb-1">Date To</label>
                            <Input
                                type="date"
                                className="h-9"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>

                        {/* Clear */}
                        <div className="xl:col-span-1 flex items-end">
                            <Button variant="ghost" className="h-9 w-full" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" /> Clear
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name, roll number or email…"
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
                <CardHeader className="border-b pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>Results ({filtered.length})</span>
                        {filtered.length > 0 && (
                            <span className="text-xs text-muted-foreground font-normal">
                                Showing {filtered.length} of {results.length} total records
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingResults ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                            <GraduationCap className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No results found</p>
                            <p className="text-xs">Try adjusting filters or select a different batch</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Mother's Name</TableHead>
                                        <TableHead>Institute</TableHead>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Batch</TableHead>
                                        <TableHead className="text-center">Percentage</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((r: any, idx: number) => {
                                        const pct = r.percentage != null ? Number(r.percentage) : null
                                        return (
                                            <TableRow key={r._id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                            {r.studentId?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{r.studentId?.name || '—'}</p>
                                                            <p className="text-xs text-muted-foreground">{r.studentId?.email || ''}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{r.studentId?.rollNo || '—'}</TableCell>
                                                <TableCell className="text-sm">{r.studentId?.motherName || '—'}</TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        {r.instituteId?.name || '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        {r.courseId?.name || '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {r.batchId?.name || '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {pct != null ? (
                                                        <span className={`font-bold ${pct >= 45 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {pct.toFixed(1)}%
                                                        </span>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.createdAt
                                                        ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Grading Key */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">GRADING SCALE</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {[
                            { grade: 'A+', range: '≥ 273 (91%+)' },
                            { grade: 'A', range: '243–272 (81–90%)' },
                            { grade: 'B+', range: '213–242 (71–80%)' },
                            { grade: 'B', range: '183–212 (61–70%)' },
                            { grade: 'C+', range: '151–182 (51–60%)' },
                            { grade: 'D', range: '135–150 (45–50%)' },
                            { grade: 'F', range: '< 135 (Fail)' },
                        ].map(({ grade, range }) => (
                            <span key={grade} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${gradeColor[grade]}`}>
                                <strong>{grade}</strong> {range}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
