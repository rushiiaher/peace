'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, MapPin, Mail, Phone, ChevronLeft, Save, Loader2 } from "lucide-react"
import Link from 'next/link'

export default function EditInstitutePage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const fetchInstitute = async () => {
            try {
                const res = await fetch(`/api/institutes/${params.instituteId}`)
                if (res.ok) {
                    const institute = await res.json()
                    setData(institute)
                } else {
                    toast.error('Failed to fetch institute details')
                    router.push('/super-admin/institutes')
                }
            } catch (error) {
                toast.error('Error loading institute')
            } finally {
                setFetching(false)
            }
        }
        if (params.instituteId) {
            fetchInstitute()
        }
    }, [params.instituteId, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const updateData = {
            name: formData.get('name'),
            code: formData.get('code'),
            location: formData.get('location'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            status: formData.get('status'),
            pendingPayment: Number(formData.get('pendingPayment'))
        }

        try {
            const res = await fetch(`/api/institutes/${params.instituteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })
            if (res.ok) {
                toast.success('Institute updated successfully')
                router.push('/super-admin/institutes')
                router.refresh()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to update institute')
            }
        } catch (error) {
            toast.error('Failed to update institute')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/institutes">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader title="Edit Institute" subtitle={`Update details for ${data.name}`} />
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Essential details about the institute</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Institute Name <span className="text-destructive">*</span></Label>
                                    <Input id="name" name="name" defaultValue={data.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Institute Code <span className="text-destructive">*</span></Label>
                                    <Input id="code" name="code" defaultValue={data.code} required className="uppercase" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Account Status</Label>
                                    <Select name="status" defaultValue={data.status}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pendingPayment">Pending Payment</Label>
                                    <Input id="pendingPayment" name="pendingPayment" type="number" defaultValue={data.pendingPayment} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Location & Contact
                            </CardTitle>
                            <CardDescription>Address and communication details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="email" name="email" type="email" defaultValue={data.email} required className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" defaultValue={data.phone} required className="pl-9" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1 space-y-2">
                                    <Label htmlFor="location">City/Location <span className="text-destructive">*</span></Label>
                                    <Input id="location" name="location" defaultValue={data.location} required />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="address">Full Address</Label>
                                    <Input id="address" name="address" defaultValue={data.address} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary/Actions */}
                <div className="space-y-6">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Update Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Changes made here will be reflected instantly across the platform.
                            </p>
                            <div className="pt-4 border-t">
                                <Button type="submit" className="w-full gap-2" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    )
}
