'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, MapPin, Mail, Phone, ChevronLeft, Save } from "lucide-react"
import Link from 'next/link'

export default function AddInstitutePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            location: formData.get('location'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            status: formData.get('status')
        }

        try {
            const res = await fetch('/api/institutes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                toast.success('Institute registered successfully')
                router.push('/super-admin/institutes')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to register institute')
            }
        } catch (error) {
            toast.error('Failed to register institute')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/super-admin/institutes">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <SectionHeader title="Register New Institute" subtitle="Onboard a new institute partner to the platform" />
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
                                    <Input id="name" name="name" required placeholder="e.g. Excellence Academy" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Institute Code <span className="text-destructive">*</span></Label>
                                    <Input id="code" name="code" required placeholder="e.g. INST001" className="uppercase" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Account Status</Label>
                                <Select name="status" defaultValue="Active">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active - Ready for login</SelectItem>
                                        <SelectItem value="Inactive">Inactive - Blocked access</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        <Input id="email" name="email" type="email" required placeholder="admin@institute.com" className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" required placeholder="+91 98765 43210" className="pl-9" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1 space-y-2">
                                    <Label htmlFor="location">City/Location <span className="text-destructive">*</span></Label>
                                    <Input id="location" name="location" required placeholder="e.g. Pune" />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="address">Full Address</Label>
                                    <Input id="address" name="address" placeholder="Street, Building, Landmark..." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary/Actions */}
                <div className="space-y-6">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Registration Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                By registering this institute, you are creating a new admin account. An email with login instructions should be sent manually if email service is not configured.
                            </p>
                            <div className="pt-4 border-t">
                                <Button type="submit" className="w-full gap-2" disabled={loading}>
                                    {loading ? 'Registering...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Register Institute
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
