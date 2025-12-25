'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { EnquiryForm } from "@/components/lms/forms/enquiry-form"
import { toast } from "sonner"
import Loader from "@/components/ui/loader"
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditEnquiryPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [initialData, setInitialData] = useState<any>(null)
    const [courses, setCourses] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (!user.instituteId) return

            const [enqRes, coursesRes, staffRes, adminRes] = await Promise.all([
                fetch(`/api/enquiries/${id}`),
                fetch(`/api/institutes/${user.instituteId}/courses`),
                fetch(`/api/staff?instituteId=${user.instituteId}`),
                fetch(`/api/users?instituteId=${user.instituteId}&role=institute-admin`)
            ])

            if (enqRes.ok) setInitialData(await enqRes.json())
            if (coursesRes.ok) setCourses(await coursesRes.json())
            if (staffRes.ok) {
                const sData = await staffRes.json()
                setStaff(sData.filter((s: any) => s.status === 'Active'))
            }
            if (adminRes.ok) setAdmins(await adminRes.json())
        } catch (error) {
            toast.error('Failed to load data')
            router.push('/institute-admin/enquiries')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (data: any) => {
        try {
            setSubmitting(true)
            const res = await fetch(`/api/enquiries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Enquiry updated successfully')
                router.push('/institute-admin/enquiries')
                router.refresh()
            } else {
                throw new Error('Failed to update')
            }
        } catch (error) {
            toast.error('Failed to update enquiry')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center py-20"><Loader /></div>

    return (

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-6 -m-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-emerald-600 hover:bg-transparent pl-0 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Enquiries
                    </Button>
                </div>

                <EnquiryForm
                    initialData={initialData}
                    courses={courses}
                    staff={staff}
                    admins={admins}
                    onSubmit={handleUpdate}
                    loading={submitting}
                    isEdit={true}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    )
}
