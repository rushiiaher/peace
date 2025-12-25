'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { StudentForm } from "@/components/lms/forms/student-form"
import { toast } from "sonner"
import Loader from "@/components/ui/loader"
import { ChevronLeft, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConvertEnquiryPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [enquiry, setEnquiry] = useState<any>(null)
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (!user.instituteId) return

            const [enqRes, coursesRes] = await Promise.all([
                fetch(`/api/enquiries/${id}`),
                fetch(`/api/institutes/${user.instituteId}/courses`)
            ])

            if (enqRes.ok) setEnquiry(await enqRes.json())
            if (coursesRes.ok) setCourses(await coursesRes.json())
        } catch (error) {
            toast.error('Failed to load data')
            router.push('/institute-admin/enquiries')
        } finally {
            setLoading(false)
        }
    }

    const handleConvert = async (formData: any) => {
        try {
            setSubmitting(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}')

            // 1. Create Student User
            const studentData = {
                ...formData,
                role: 'student',
                instituteId: user.instituteId,
                // Ensure courses array structure is what API expects
                // Form already formats it correctly for single course add
            }

            const userRes = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            })

            if (!userRes.ok) {
                const error = await userRes.json()
                toast.error(error.error || 'Failed to create student account')
                setSubmitting(false)
                return
            }

            // 2. Update Enquiry Status to Converted
            const updateRes = await fetch(`/api/enquiries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Converted',
                    handledBy: user._id, // Assign to current user as they converted it
                    handledByModel: 'User'
                })
            })

            if (updateRes.ok) {
                toast.success(`Successfully converted ${enquiry.name} to Admission!`)
                router.push('/institute-admin/enquiries')
                router.refresh()
            } else {
                toast.warning('Student created, but failed to update enquiry status')
                router.push('/institute-admin/students')
            }

        } catch (error) {
            toast.error('An error occurred during conversion')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center py-20"><Loader /></div>

    // find course ID if possible match
    const matchedCourse = courses.find((c: any) => c.courseId?.name === enquiry?.courseInterested)

    const prefillData = enquiry ? {
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        address: enquiry.address,
        courseInterested: enquiry.courseInterested, // Just for display reference
        courseId: matchedCourse?.courseId?._id // Attempt to pre-select dropdown
    } : {}

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <SectionHeader
                    title="Convert to Admission"
                    subtitle={`Finalize admission details for ${enquiry?.name}`}
                />
            </div>

            <Card className="border-green-200 dark:border-green-900 bg-green-50/10">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6 text-green-700 dark:text-green-500 font-medium p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <GraduationCap className="w-5 h-5" />
                        <span>You are converting an enquiry into a full student admission.</span>
                    </div>

                    <StudentForm
                        initialData={prefillData}
                        courses={courses}
                        onSubmit={handleConvert}
                        loading={submitting}
                        isEdit={false} // It's a new student creation technically
                    />
                </CardContent>
            </Card>
        </div>
    )
}
