'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { EnquiryForm } from "@/components/lms/forms/enquiry-form"
import { toast } from "sonner"
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddEnquiryPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (!user.instituteId) return

            const [coursesRes, staffRes, adminRes] = await Promise.all([
                fetch(`/api/institutes/${user.instituteId}/courses`),
                fetch(`/api/staff?instituteId=${user.instituteId}`),
                fetch(`/api/users?instituteId=${user.instituteId}&role=institute-admin`)
            ])

            if (coursesRes.ok) setCourses(await coursesRes.json())
            if (staffRes.ok) {
                const sData = await staffRes.json()
                setStaff(sData.filter((s: any) => s.status === 'Active'))
            }
            if (adminRes.ok) setAdmins(await adminRes.json())
        } catch (error) {
            toast.error('Failed to load form data')
        }
    }

    const handleCreate = async (data: any) => {
        try {
            setLoading(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}')

            const payload = {
                ...data,
                instituteId: user.instituteId
            }

            const res = await fetch('/api/enquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Enquiry added successfully')
                router.push('/institute-admin/enquiries')
                router.refresh()
            } else {
                throw new Error('Failed to create')
            }
        } catch (error) {
            toast.error('Failed to add enquiry')
        } finally {
            setLoading(false)
        }
    }

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
                    courses={courses}
                    staff={staff}
                    admins={admins}
                    onSubmit={handleCreate}
                    loading={loading}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    )
}
