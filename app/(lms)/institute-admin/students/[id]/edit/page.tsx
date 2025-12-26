'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { StudentForm } from "@/components/lms/forms/student-form"
import { toast } from "sonner"
import Loader from "@/components/ui/loader"
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditStudentPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [student, setStudent] = useState<any>(null)
    const [courses, setCourses] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (!user.instituteId) return

            const [userRes, coursesRes, batchesRes] = await Promise.all([
                fetch(`/api/users/${id}`),
                fetch(`/api/institutes/${user.instituteId}/courses`),
                fetch(`/api/batches?instituteId=${user.instituteId}`)
            ])

            if (userRes.ok) {
                setStudent(await userRes.json())
            } else {
                toast.error('Student not found')
                router.push('/institute-admin/students')
            }
            if (coursesRes.ok) setCourses(await coursesRes.json())
            if (batchesRes.ok) setBatches(await batchesRes.json())
        } catch (error) {
            toast.error('Failed to load data')
            router.push('/institute-admin/students')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (data: any) => {
        try {
            setSubmitting(true)
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Student updated successfully')
                router.push('/institute-admin/students')
                router.refresh()
            } else {
                toast.error('Failed to update student')
            }
        } catch (error) {
            toast.error('Failed to update student')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCourseAdd = async (courseId: string, batchId?: string, booksIncluded?: boolean) => {
        try {
            // If batchId is provided, enroll via Batch API (preferred)
            if (batchId) {
                const res = await fetch(`/api/batches/${batchId}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: id,
                        booksIncluded: booksIncluded || false
                    })
                })

                if (res.ok) {
                    toast.success('Enrolled in batch successfully')
                    // Refetch student to get updated courses list
                    const userRes = await fetch(`/api/users/${id}`)
                    if (userRes.ok) {
                        const updated = await userRes.json()
                        setStudent(updated)
                        return updated
                    }
                } else {
                    const err = await res.json()
                    toast.error(err.error || 'Failed to enroll in batch')
                }
            } else {
                // Fallback: Just add course (legacy)
                const res = await fetch(`/api/users/${id}/courses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, booksIncluded: booksIncluded || false })
                })
                if (res.ok) {
                    toast.success('Course added')
                    const updated = await res.json()
                    setStudent(updated)
                    return updated
                } else {
                    toast.error('Failed to add course')
                }
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to add course')
        }
    }

    const handleCourseRemove = async (courseId: string) => {
        try {
            const res = await fetch(`/api/users/${id}/courses/${courseId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Course removed')
                const updated = await res.json()
                setStudent(updated)
                return updated
            } else {
                toast.error('Failed to remove course')
            }
        } catch (error) {
            toast.error('Failed to remove course')
        }
    }

    if (loading) return <div className="flex justify-center py-20"><Loader /></div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <SectionHeader title="Edit Student" subtitle={`Manage details for ${student?.name}`} />
            </div>

            <Card>
                <CardContent className="p-6">
                    <StudentForm
                        initialData={student}
                        courses={courses}
                        batches={batches}
                        onSubmit={handleUpdate}
                        loading={submitting}
                        isEdit={true}
                        onCourseAdd={handleCourseAdd}
                        onCourseRemove={handleCourseRemove}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
