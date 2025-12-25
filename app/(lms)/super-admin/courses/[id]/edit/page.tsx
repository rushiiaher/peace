'use client'

import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { CourseForm } from "@/components/lms/forms/course-form"
import Loader from "@/components/ui/loader"
import { useState, useEffect, use } from 'react'

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [course, setCourse] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCourse()
    }, [id])

    const fetchCourse = async () => {
        try {
            // Try fetching single course
            const resSingle = await fetch(`/api/courses/${id}`)
            if (resSingle.ok) {
                const data = await resSingle.json()
                setCourse(data)
            } else {
                // Fallback to finding in list if single fetch not available
                const resAll = await fetch('/api/courses')
                const all = await resAll.json()
                const found = all.find((c: any) => c._id === id)
                setCourse(found)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>
    if (!course) return <div>Course not found</div>

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/courses">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Edit Course"
                    subtitle={`Edit details for ${course.name}`}
                />
            </div>

            <CourseForm mode="edit" initialData={course} />
        </div>
    )
}
