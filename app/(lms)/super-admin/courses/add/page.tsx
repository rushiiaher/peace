'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    ArrowLeft,
    IndianRupee,
    FileText,
    Book,
    Truck,
    Award,
    LayoutDashboard,
    Files,
    Receipt
} from "lucide-react"
import Link from 'next/link'

export default function AddCoursePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            category: formData.get('category'),
            about: formData.get('about'),
            syllabus: formData.get('syllabus'),
            description: formData.get('description'),
            duration: formData.get('duration'),
            finalExamCount: Number(formData.get('finalExamCount')),
            baseFee: Number(formData.get('baseFee')),
            examFee: Number(formData.get('examFee')),
            bookPrice: Number(formData.get('bookPrice')),
            deliveryCharge: Number(formData.get('deliveryCharge')),
            certificateCharge: Number(formData.get('certificateCharge'))
        }

        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Course created successfully')
                router.push('/super-admin/courses')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Failed to create course')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

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

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Core Information Section */}
                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Essential details about the course</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Course Name <span className="text-destructive">*</span></Label>
                            <Input id="name" name="name" placeholder="e.g. Full Stack Development" required className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Course Code <span className="text-destructive">*</span></Label>
                            <Input id="code" name="code" placeholder="e.g. FSD-101" required className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" placeholder="e.g. Technology" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" name="duration" placeholder="e.g. 6 months" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="finalExamCount">Final Exam Count</Label>
                            <Input id="finalExamCount" name="finalExamCount" type="number" defaultValue="1" min="1" className="h-11" />
                        </div>
                    </CardContent>
                </Card>

                {/* Content Section */}
                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Files className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle>Course Content</CardTitle>
                                <CardDescription>Syllabus and descriptions displayed to students</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 p-6">
                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="A brief overview of the course (displayed on cards)"
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="about">About Course</Label>
                            <Textarea
                                id="about"
                                name="about"
                                placeholder="Detailed explanation of what the course covers..."
                                rows={5}
                                className="resize-y min-h-[120px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="syllabus">Syllabus Content</Label>
                            <Textarea
                                id="syllabus"
                                name="syllabus"
                                placeholder="Module 1: Introduction..."
                                rows={8}
                                className="resize-y min-h-[200px] font-mono text-sm leading-relaxed"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Section */}
                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Pricing Structure</CardTitle>
                                <CardDescription>Define fees and additional charges</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <IndianRupee className="w-4 h-4" />
                                    <Label htmlFor="baseFee" className="cursor-pointer">Base Fee</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input id="baseFee" name="baseFee" type="number" defaultValue="0" className="pl-7 h-11 text-lg font-medium" />
                                </div>
                            </div>

                            <div className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    <Label htmlFor="examFee" className="cursor-pointer">Exam Fee</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input id="examFee" name="examFee" type="number" defaultValue="0" className="pl-7 h-11 text-lg font-medium" />
                                </div>
                            </div>

                            <div className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Book className="w-4 h-4" />
                                    <Label htmlFor="bookPrice" className="cursor-pointer">Book Price</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input id="bookPrice" name="bookPrice" type="number" defaultValue="0" className="pl-7 h-11 text-lg font-medium" />
                                </div>
                            </div>

                            <div className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Truck className="w-4 h-4" />
                                    <Label htmlFor="deliveryCharge" className="cursor-pointer">Delivery Charge</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input id="deliveryCharge" name="deliveryCharge" type="number" defaultValue="0" className="pl-7 h-11 text-lg font-medium" />
                                </div>
                            </div>

                            <div className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Award className="w-4 h-4" />
                                    <Label htmlFor="certificateCharge" className="cursor-pointer">Certificate Charge</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input id="certificateCharge" name="certificateCharge" type="number" defaultValue="60" className="pl-7 h-11 text-lg font-medium" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <Button variant="outline" type="button" size="lg" asChild>
                        <Link href="/super-admin/courses">Cancel</Link>
                    </Button>
                    <Button type="submit" size="lg" disabled={loading} className="min-w-[150px]">
                        {loading ? 'Creating...' : 'Create Course'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
