'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, Send, AlertCircle, CheckCircle2, ArrowLeft, Download } from "lucide-react"
import Loader from "@/components/ui/loader"
import Link from 'next/link'
import { generateProvisionalCertificateHtml, calculateGrade, calculateResult, maskAadhaar } from '@/utils/generate-provisional-certificate'

export default function BatchResultEntryPage() {
    const params = useParams()
    const router = useRouter()
    const batchId = params.id as string

    const [loading, setLoading] = useState(true)
    const [batch, setBatch] = useState<any>(null)
    const [course, setCourse] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])

    // Structure: { [studentId]: { VIVA: 45, PRACTICAL: 80, ... } }
    const [marksMap, setMarksMap] = useState<Record<string, Record<string, number>>>({})
    const [existingResults, setExistingResults] = useState<any[]>([])
    const [finalExamResults, setFinalExamResults] = useState<any[]>([])
    const [finalExamMetadata, setFinalExamMetadata] = useState<any>(null)

    const [instituteId, setInstituteId] = useState<string | null>(null)
    const [institute, setInstitute] = useState<any>(null)

    const finalCompName = useMemo(() => {
        if (!course) return 'Final Exam'
        const comp = dynamicComponents.find((c: any) => c.name.toLowerCase().includes('final'))
        return comp?.name || 'Final Exam'
    }, [course, dynamicComponents])

    // Derived State for Components including dynamically fetched Final Exam
    // Derived State for Components including dynamically fetched Final Exam
    const dynamicComponents = useMemo(() => {
        if (!course) return []
        const components = [...(course.evaluationComponents || [])]
        if (finalExamMetadata && !components.some((c: any) => c.name === finalCompName || c.name.includes('Final'))) {
            components.push({
                name: finalCompName,
                maxMarks: finalExamMetadata.totalMarks || 100
            })
        }
        return components
    }, [course, finalExamMetadata, finalCompName])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.instituteId) setInstituteId(user.instituteId)
    }, [])

    useEffect(() => {
        if (instituteId && batchId) {
            fetchData()
        }
    }, [instituteId, batchId])

    const fetchData = async () => {
        try {
            // 1. Fetch Batch
            const batchRes = await fetch(`/api/batches?id=${batchId}`) // Assuming /api/batches supports ?id or simple filter
            // Actually standard is often /api/batches/[id] but current route.ts is query based. 
            // Let's try fetching all batches and finding (not efficient but checking route.ts)
            // Wait, route.ts has ?instituteId. 
            // I should use that or fix API to get single. 
            // For now, I'll fetch list and find. (Or better: create /api/batches/[id] route later if needed).
            // Actually, I can use the same endpoint if I filter by id in frontend or if backend supports it.
            // Let's assume I fetch all batches for institute and find.
            const allBatchesRes = await fetch(`/api/batches?instituteId=${instituteId}`)
            const allBatches = await allBatchesRes.json()
            const currentBatch = allBatches.find((b: any) => b._id === batchId)

            if (!currentBatch) {
                toast.error("Batch not found")
                return
            }
            setBatch(currentBatch)

            // 2. Fetch Course (for components)
            // Batch has courseId populated? usually yes.
            // If populated:
            setCourse(currentBatch.courseId)
            const courseId = currentBatch.courseId._id || currentBatch.courseId

            // 2.1 Fetch ALL Final Exam Metadata & Results (including rescheduled ones)
            let fExamResults: any[] = []
            let fExamMeta: any = null
            try {
                const examsRes = await fetch(`/api/exams?courseId=${courseId}&type=Final`)
                const exams = await examsRes.json()
                if (exams.length > 0) {
                    // Get the most recent exam for metadata (marks, duration, etc.)
                    fExamMeta = exams[0]
                    setFinalExamMetadata(fExamMeta)

                    // Fetch non-superseded results from ALL Final exams for this course
                    // This handles cases where students took original or rescheduled exams
                    const allExamIds = exams.map((e: any) => e._id)

                    const resultsPromises = allExamIds.map((examId: string) =>
                        fetch(`/api/exam-results?examId=${examId}`).then(r => r.json())
                    )

                    const allExamResults = await Promise.all(resultsPromises)
                    const flatResults = allExamResults.flat()

                    // Filter out superseded results and keep only latest for each student
                    const studentResultMap = new Map()
                    flatResults.forEach((result: any) => {
                        if (result.superseded !== true) {
                            const studentId = result.studentId?._id || result.studentId
                            // Keep the latest result (higher score or more recent)
                            if (!studentResultMap.has(studentId) ||
                                result.score > studentResultMap.get(studentId).score ||
                                new Date(result.submittedAt) > new Date(studentResultMap.get(studentId).submittedAt)) {
                                studentResultMap.set(studentId, result)
                            }
                        }
                    })

                    fExamResults = Array.from(studentResultMap.values())
                    setFinalExamResults(fExamResults)
                }
            } catch (e) { console.error("Exam fetch error", e) }


            // 3. Fetch Students (Royalty Paid Only)
            const studentsRes = await fetch(`/api/users?instituteId=${instituteId}&role=student&courseId=${courseId}&royaltyPaid=true&batchId=${batchId}`)
            const studentsData = await studentsRes.json()
            setStudents(Array.isArray(studentsData) ? studentsData : [])

            // 4. Fetch Existing Results
            const resultsRes = await fetch(`/api/final-results?batchId=${batchId}&instituteId=${instituteId}`)
            const resultsData = await resultsRes.json()
            setExistingResults(resultsData)

            // 4.1 Fetch Institute Data for Certificate
            try {
                const instituteRes = await fetch(`/api/institutes/${instituteId}`)
                const instituteData = await instituteRes.json()
                setInstitute(instituteData)
            } catch (e) { console.error("Institute fetch error", e) }

            // 5. Initialize Marks Map
            const initialMarks: any = {}
            resultsData.forEach((res: any) => {
                const marks: any = {}
                res.evaluationMarks.forEach((m: any) => {
                    marks[m.name] = m.marksObtained
                })
                initialMarks[res.studentId._id || res.studentId] = marks
            })

            // Merge Final Exam Results
            // We look for a component named "Final Exam" or "Theory" roughly matching the exam
            // Or we assume a component named "Final Exam" exists.
            studentsData.forEach((student: any) => {
                const sid = student._id
                if (!initialMarks[sid]) initialMarks[sid] = {}

                // Check for duplicate population to avoid overwriting existing saved manual edits 
                // IF the exam result is missing? Actually Exam Result is source of truth.
                // If Exam Result exists, we enforce it.

                const examRes = fExamResults.find((r: any) => (r.studentId._id || r.studentId) === sid)

                // We target the identified final component name.
                // Sentinel -1 means Not Conducted / Absent.

                if (examRes) {
                    initialMarks[sid][finalCompName] = examRes.score
                } else {
                    // If exam metadata exists but student has no result -> Not Conducted
                    // If exam metadata doesn't exist -> we let it be 0 or manual (or handle as normal)
                    if (fExamMeta) {
                        initialMarks[sid][finalCompName] = -1
                    }
                }
            })
            setMarksMap(initialMarks)

        } catch (error) {
            console.error("Error fetching data", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleMarkChange = (studentId: string, componentName: string, value: string, max: number) => {
        const numVal = Math.min(Math.max(0, Number(value)), max)
        setMarksMap(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [componentName]: numVal
            }
        }))
    }

    const calculateTotal = (studentId: string) => {
        const studentMarks = marksMap[studentId] || {}
        let total = 0
        dynamicComponents.forEach((comp: any) => {
            const val = studentMarks[comp.name]
            // Treat -1 (Not Conducted) as 0 for total calculation
            const numericVal = (val === -1 || val === undefined || val === null) ? 0 : val
            total += numericVal
        })
        return total
    }

    const calculatePercentage = (total: number) => {
        const maxTotal = dynamicComponents.reduce((sum: number, c: any) => sum + c.maxMarks, 0)
        if (maxTotal === 0) return 0
        return Math.round((total / maxTotal) * 100)
    }

    // Download Provisional Certificate
    const handleDownloadCertificate = (student: any) => {
        if (!course || !batch || !institute) {
            toast.error('Missing required data for certificate')
            return
        }

        const studentMarks = marksMap[student._id] || {}
        const total = calculateTotal(student._id)
        const maxTotal = dynamicComponents.reduce((sum: number, c: any) => sum + c.maxMarks, 0)
        const percentage = calculatePercentage(total)

        // Get evaluation marks (exclude Final Exam)
        const evaluationComponents = dynamicComponents
            .filter((comp: any) => !comp.name.toLowerCase().includes('final'))
            .slice(0, 4) // Max 4 components
            .map((comp: any) => ({
                name: comp.name,
                marksObtained: studentMarks[comp.name] || 0,
                maxMarks: comp.maxMarks
            }))

        // Get Final Exam data
        const finalExamMarks = studentMarks[finalCompName] || 0
        const finalExamConfig = dynamicComponents.find((c: any) => c.name === finalCompName)
        const finalExamMaxMarks = finalExamConfig?.maxMarks || (finalExamMetadata?.totalMarks || 100)

        // Calculate correct answers (2 marks per question)
        const finalExamCorrect = Math.floor(finalExamMarks / 2)
        const finalExamQuestions = finalExamMetadata?.questions?.length || 50

        // Calculate result (35+ questions correct + 40%+ overall)
        const result = calculateResult(finalExamCorrect, total, maxTotal)
        const grade = calculateGrade(percentage)

        const certificateData = {
            candidateName: student.name || '',
            motherName: student.motherName || '',
            courseCode: course.code || course.courseCode || '1000',
            courseName: course.name || '',
            examCenter: institute.name || '',
            rollNo: student.rollNo || 'N/A',
            aadhaarNo: student.aadhaarCardNo || '',
            evaluationComponents,
            finalExamMarks,
            finalExamMaxMarks,
            finalExamQuestions,
            finalExamCorrect,
            totalMarks: total,
            totalMaxMarks: maxTotal,
            percentage,
            grade,
            result,
            issueDate: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }

        const html = generateProvisionalCertificateHtml(certificateData)
        const newWindow = window.open('', '_blank')
        if (newWindow) {
            newWindow.document.write(html)
            newWindow.document.close()
        } else {
            toast.error('Please allow pop-ups to download certificate')
        }
    }

    const handleSave = async () => {
        if (!course || !batch) return

        const payload = students.map(student => {
            const studentMarks = marksMap[student._id] || {}

            // Separate Final Exam from other evaluation components
            const evalMarks = dynamicComponents
                .filter((comp: any) => !comp.name.toLowerCase().includes('final'))
                .map((comp: any) => ({
                    name: comp.name,
                    marksObtained: studentMarks[comp.name] || 0,
                    maxMarks: comp.maxMarks
                }))

            const onlineExamScore = studentMarks['Final Exam'] || 0
            const totalScore = calculateTotal(student._id)
            const totalMaxMarks = dynamicComponents.reduce((sum: number, c: any) => sum + c.maxMarks, 0)

            return {
                studentId: student._id,
                courseId: course._id || course,
                batchId: batch._id,
                instituteId: instituteId,
                evaluationMarks: evalMarks,
                onlineExamScore,
                totalScore,
                totalMaxMarks,
                percentage: calculatePercentage(totalScore),
                aadhaarCardNo: student.aadhaarCardNo // Optional: snapshot for reference
            }
        })

        try {
            const res = await fetch('/api/final-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: payload })
            })

            if (res.ok) {
                toast.success("Results saved successfully")
                fetchData() // Refresh
            } else {
                toast.error("Failed to save results")
            }
        } catch (error) {
            toast.error("Error saving results")
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>

    if (!course) return <div className="p-6">Batch/Course data missing or invalid.</div>

    const totalMaxMarks = dynamicComponents.reduce((sum: number, c: any) => sum + c.maxMarks, 0)

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/institute-admin/final-results">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title={batch?.name || "Results Processing"}
                    subtitle={`Enter marks for ${students.length} royalty-paid students`}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" /> Save Draft
                </Button>
            </div>

            <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[200px]">Student Details</TableHead>
                            <TableHead>Mother's Name</TableHead>
                            {dynamicComponents.map((comp: any) => (
                                <TableHead key={comp.name} className="text-center">
                                    {comp.name} Note <br />
                                    <span className="text-[10px] text-muted-foreground">(Max: {comp.maxMarks})</span>
                                </TableHead>
                            ))}
                            <TableHead className="text-center w-[100px]">Total<br />(/{totalMaxMarks})</TableHead>
                            <TableHead className="text-center w-[80px]">%</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center w-[120px]">Certificate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5 + dynamicComponents.length} className="text-center py-8 text-muted-foreground">
                                    No students with Paid Royalty found in this batch.
                                </TableCell>
                            </TableRow>
                        ) : students.map(student => {
                            const result = existingResults.find(r => (r.studentId._id || r.studentId) === student._id)
                            const total = calculateTotal(student._id)
                            const percentage = calculatePercentage(total)

                            return (
                                <TableRow key={student._id}>
                                    <TableCell>
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-xs text-muted-foreground">{student.rollNo || 'No Roll No'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {student.motherName || '---'}
                                    </TableCell>
                                    {dynamicComponents.map((comp: any) => {
                                        const val = marksMap[student._id]?.[comp.name]
                                        const isFinalExam = comp.name === "Final Exam" || comp.name.includes("Final")

                                        // Specific handling for Final Exam Auto-Population
                                        if (isFinalExam && val === -1) {
                                            return (
                                                <TableCell key={comp.name} className="p-2 text-center">
                                                    <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 whitespace-nowrap text-[10px] px-1">
                                                        Not Conducted
                                                    </Badge>
                                                </TableCell>
                                            )
                                        }

                                        return (
                                            <TableCell key={comp.name} className="p-2">
                                                <Input
                                                    type="number"
                                                    className="w-20 mx-auto text-center h-8"
                                                    value={val ?? ''}
                                                    onChange={(e) => handleMarkChange(student._id, comp.name, e.target.value, comp.maxMarks)}
                                                    disabled={isFinalExam && val !== undefined} // Disable if auto-populated
                                                />
                                            </TableCell>
                                        )
                                    })}
                                    <TableCell className="text-center font-bold">
                                        {total}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={percentage >= 40 ? "default" : "destructive"}>
                                            {percentage}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {result?.submittedToSuperAdmin ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Submitted</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadCertificate(student)}
                                            className="gap-1 h-8 text-xs"
                                            disabled={!marksMap[student._id]?.[finalCompName] || marksMap[student._id]?.[finalCompName] === -1}
                                        >
                                            <Download className="w-3 h-3" />
                                            Certificate
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <p className="text-xs text-muted-foreground self-center mr-auto">
                    * Only students who have paid the Royalty Fee to Super Admin are listed here.
                </p>
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 gap-2 disabled:opacity-50"
                    disabled={students.some(s => marksMap[s._id]?.[finalCompName] === -1)}
                    title={students.some(s => marksMap[s._id]?.[finalCompName] === -1) ? "Cannot submit: Final Exam pending for some students" : ""}
                >
                    <Send className="w-4 h-4" /> Finalize & Submit to Super Admin
                </Button>
            </div>
        </div>
    )
}
