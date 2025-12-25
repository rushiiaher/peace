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
    const [loading, setLoading] = useState(false)
    const [instituteId, setInstituteId] = useState<string | null>(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.instituteId) {
            setInstituteId(user.instituteId)
            fetchCourses(user.instituteId)
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

    const handleCreate = async (data: any) => {
        try {
            setLoading(true)
            const payload = {
                ...data,
                instituteId,
                role: 'student'
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Student added successfully')
                router.push('/institute-admin/students')
                router.refresh()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to add student')
            }
        } catch (error) {
            toast.error('Failed to add student')
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
                    <StudentForm
                        courses={courses}
                        onSubmit={handleCreate}
                        loading={loading}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
