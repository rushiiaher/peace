'use client'

import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { CourseForm } from "@/components/lms/forms/course-form"

export default function AddCoursePage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/courses">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader
                    title="Create New Course"
                    subtitle="Define course details, curriculum, and pricing structure"
                />
            </div>

            <CourseForm mode="create" />
        </div>
    )
}
