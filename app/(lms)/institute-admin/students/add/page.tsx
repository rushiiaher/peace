'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { StudentForm } from "@/components/lms/forms/student-form"
import { toast } from "sonner"
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddStudentPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [instituteId, setInstituteId] = useState<string | null>(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.instituteId) {
            setInstituteId(user.instituteId)
            fetchCourses(user.instituteId)
            fetchBatches(user.instituteId)
        }
    }, [])

    const fetchCourses = async (instId: string) => {
        try {
            const res = await fetch(`/api/institutes/${instId}/courses`)
            const data = await res.json()
            setCourses(data)
        } catch (error) {
            toast.error('Failed to fetch courses')
        }
    }

    const fetchBatches = async (instId: string) => {
        try {
            const res = await fetch(`/api/batches?instituteId=${instId}`)
            const data = await res.json()
            setBatches(data)
        } catch (error) {
            toast.error('Failed to fetch batches')
        }
    }

    const handleCreate = async (data: any) => {
        try {
            if (!instituteId) {
                toast.error('Session error: Institute ID missing. Please login again.')
                return
            }

            setLoading(true)

            const { batchId, booksIncluded, ...studentData } = data

            // 1. Create Student
            const payload = {
                ...studentData,
                instituteId,
                role: 'student',
                courses: []
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to add student')
            }

            const newStudent = await res.json()

            // 2. Add to Batch
            if (batchId) {
                const batchRes = await fetch(`/api/batches/${batchId}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: newStudent._id,
                        booksIncluded: booksIncluded
                    })
                })

                if (!batchRes.ok) {
                    toast.error('Student created but batch enrollment failed')
                } else {
                    toast.success('Student added and enrolled in batch')
                }
            } else {
                toast.success('Student added (not enrolled)')
            }

            router.push('/institute-admin/students')
            router.refresh()

        } catch (error: any) {
            toast.error(error.message || 'Failed to add student')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <SectionHeader title="Add New Student" subtitle="Enroll a new student manually" />
            </div>

            <Card>
                <CardContent className="p-6">
                    <Card>
                        <CardContent className="p-6">
                            <StudentForm
                                courses={courses}
                                batches={batches}
                                onSubmit={handleCreate}
                                loading={loading}
                            />
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}
