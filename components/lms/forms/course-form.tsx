'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    Receipt,
    Plus,
    Trash2,
    GraduationCap,
    Cpu
} from "lucide-react"
import Link from 'next/link'

interface CourseFormProps {
    initialData?: any
    mode: 'create' | 'edit'
}

export function CourseForm({ initialData, mode }: CourseFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [qbs, setQbs] = useState<any[]>([])
    const [finalExamCount, setFinalExamCount] = useState(initialData?.finalExamCount || 1)
    const [examConfigs, setExamConfigs] = useState<any[]>(
        initialData?.examConfigurations || []
    )

    const [evaluationComponents, setEvaluationComponents] = useState(
        initialData?.evaluationComponents || []
    )

    // Fixed INTERNAL ASSESSMENT component options (matching certificate)
    const AVAILABLE_COMPONENTS = [
        { name: 'Assignment', defaultMarks: 50 },
        { name: 'Practical', defaultMarks: 50 },
        { name: 'Project', defaultMarks: 50 },
        { name: 'Viva', defaultMarks: 50 }
    ]

    const addComponent = () => {
        // Find first component not already added
        const usedNames = evaluationComponents.map((c: any) => c.name)
        const availableOption = AVAILABLE_COMPONENTS.find(opt => !usedNames.includes(opt.name))
        if (availableOption) {
            setEvaluationComponents([...evaluationComponents, { name: availableOption.name, maxMarks: availableOption.defaultMarks }])
        }
    }
    const removeComponent = (index: number) => setEvaluationComponents(evaluationComponents.filter((_: any, i: number) => i !== index))
    const updateComponent = (index: number, field: string, value: string | number) => {
        const newComponents = [...evaluationComponents]
        newComponents[index] = { ...newComponents[index], [field]: value }
        setEvaluationComponents(newComponents)
    }

    useEffect(() => {
        // Fetch question banks filtered by course
        const courseId = initialData?._id || initialData?.id
        const qbUrl = courseId
            ? `/api/question-banks?courseId=${courseId}`
            : '/api/question-banks'

        fetch(qbUrl)
            .then(res => res.json())
            .then(data => setQbs(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to fetch QBs", err))

        // Initialize exam configs if empty
        if ((!initialData?.examConfigurations || initialData.examConfigurations.length === 0) && finalExamCount > 0) {
            updateExamConfigsCount(finalExamCount)
        }
    }, [initialData])

    const updateExamConfigsCount = (count: number) => {
        setFinalExamCount(count)
        const current = [...examConfigs]
        if (count > current.length) {
            for (let i = current.length; i < count; i++) {
                current.push({ examNumber: i + 1, duration: 60, totalQuestions: 50, questionBanks: [] })
            }
        } else if (count < current.length) {
            current.length = count
        }
        setExamConfigs(current)
    }

    const updateExamConfig = (index: number, field: string, value: any) => {
        const newConfigs = [...examConfigs]
        newConfigs[index] = { ...newConfigs[index], [field]: value }
        setExamConfigs(newConfigs)
    }

    const toggleQB = (examIndex: number, qbId: string) => {
        const newConfigs = [...examConfigs]
        const currentQBs = newConfigs[examIndex].questionBanks || []

        // Normalize to array of ID strings
        const currentIds = currentQBs.map((qb: any) =>
            (typeof qb === 'object' && qb !== null) ? qb._id : qb
        ).filter(Boolean)

        let newIds
        if (currentIds.includes(qbId)) {
            newIds = currentIds.filter((id: string) => id !== qbId)
        } else {
            newIds = [...currentIds, qbId]
        }

        newConfigs[examIndex] = {
            ...newConfigs[examIndex],
            questionBanks: newIds
        }
        setExamConfigs(newConfigs)
    }

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
            finalExamCount: finalExamCount,
            examConfigurations: examConfigs,
            baseFee: Number(formData.get('baseFee')),
            examFee: Number(formData.get('examFee')),
            bookPrice: Number(formData.get('bookPrice')),
            deliveryCharge: Number(formData.get('deliveryCharge')),
            certificateCharge: Number(formData.get('certificateCharge')),
            evaluationComponents: evaluationComponents.filter((c: any) => c.name && c.maxMarks > 0)
        }

        try {
            const url = mode === 'edit' ? `/api/courses/${initialData._id}` : '/api/courses'
            const method = mode === 'edit' ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success(`Course ${mode === 'edit' ? 'updated' : 'created'} successfully`)
                router.push('/super-admin/courses')
            } else {
                const error = await res.json()
                toast.error(error.message || `Failed to ${mode} course`)
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
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
                        <Input id="name" name="name" defaultValue={initialData?.name} placeholder="e.g. Full Stack Development" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Course Code <span className="text-destructive">*</span></Label>
                        <Input id="code" name="code" defaultValue={initialData?.code} placeholder="e.g. FSD-101" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" defaultValue={initialData?.category} placeholder="e.g. Technology" className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input id="duration" name="duration" defaultValue={initialData?.duration} placeholder="e.g. 6 months" className="h-11" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle>Exam Configuration</CardTitle>
                            <CardDescription>Setup details for each final exam</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="finalExamCount">Number of Final Exams</Label>
                        <Input
                            id="finalExamCount"
                            name="finalExamCount"
                            type="number"
                            value={finalExamCount}
                            onChange={(e) => updateExamConfigsCount(Number(e.target.value))}
                            min="1"
                            className="h-11 max-w-[200px]"
                        />
                    </div>

                    <div className="grid gap-6">
                        {examConfigs.map((config, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/10">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                        {index + 1}
                                    </span>
                                    Exam {index + 1}
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Duration (Minutes)</Label>
                                        <Input
                                            type="number"
                                            value={config.duration}
                                            onChange={(e) => updateExamConfig(index, 'duration', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Questions</Label>
                                        <Input
                                            type="number"
                                            value={config.totalQuestions}
                                            onChange={(e) => updateExamConfig(index, 'totalQuestions', Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Question Banks Source</Label>
                                    <div className="border rounded-md max-h-40 overflow-y-auto p-2 grid grid-cols-1 gap-2 bg-background">
                                        {qbs.length > 0 ? qbs.map(qb => (
                                            <div key={qb._id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`exam-${index}-qb-${qb._id}`}
                                                    checked={(config.questionBanks?.map((q: any) => typeof q === 'object' ? q._id : q) || []).includes(qb._id)}
                                                    onChange={() => toggleQB(index, qb._id)}
                                                    className="rounded border-gray-300"
                                                />
                                                <label htmlFor={`exam-${index}-qb-${qb._id}`} className="text-sm cursor-pointer flex-1">
                                                    {qb.topic} <span className="text-xs text-muted-foreground">({qb.questions?.length})</span>
                                                </label>
                                            </div>
                                        )) : <div className="text-sm text-muted-foreground p-2">No Question Banks Available</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

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
                        <Textarea id="description" name="description" defaultValue={initialData?.description} placeholder="Brief overview..." rows={3} className="resize-none" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="about">About Course</Label>
                        <Textarea id="about" name="about" defaultValue={initialData?.about} placeholder="Detailed explanation..." rows={5} className="resize-y min-h-[120px]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="syllabus">Syllabus Content</Label>
                        <Textarea id="syllabus" name="syllabus" defaultValue={initialData?.syllabus} placeholder="Module 1: Introduction..." rows={8} className="resize-y min-h-[200px] font-mono text-sm leading-relaxed" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Evaluation & Grading</CardTitle>
                            <CardDescription>Define metrics for final result calculation</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid gap-4">
                        {evaluationComponents.map((component: any, index: number) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Component Name</Label>
                                    <Input
                                        value={component.name}
                                        onChange={(e) => updateComponent(index, 'name', e.target.value)}
                                        placeholder="e.g. VIVA, PROJECT"
                                        required
                                    />
                                </div>
                                <div className="w-[150px] space-y-2">
                                    <Label>Max Marks</Label>
                                    <Input
                                        type="number"
                                        value={component.maxMarks}
                                        onChange={(e) => updateComponent(index, 'maxMarks', Number(e.target.value))}
                                        placeholder="50"
                                        min="0"
                                        required
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-destructive" onClick={() => removeComponent(index)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" onClick={addComponent} className="w-full border-dashed">
                        <Plus className="w-4 h-4 mr-2" /> Add Evaluation Component
                    </Button>
                </CardContent>
            </Card>

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
                        {[
                            { id: 'baseFee', label: 'Base Fee', icon: IndianRupee },
                            { id: 'examFee', label: 'Exam Fee', icon: FileText },
                            { id: 'bookPrice', label: 'Book Price', icon: Book },
                            { id: 'deliveryCharge', label: 'Delivery Charge', icon: Truck },
                            { id: 'certificateCharge', label: 'Certificate Charge', icon: Award }
                        ].map((field) => (
                            <div key={field.id} className="space-y-3 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <field.icon className="w-4 h-4" />
                                    <Label htmlFor={field.id} className="cursor-pointer">{field.label}</Label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        id={field.id}
                                        name={field.id}
                                        type="number"
                                        defaultValue={initialData?.[field.id] || 0}
                                        className="pl-7 h-11 text-lg font-medium"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 pt-4">
                <Button variant="outline" type="button" size="lg" asChild>
                    <Link href="/super-admin/courses">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" disabled={loading} className="min-w-[150px]">
                    {loading ? 'Saving...' : (mode === 'edit' ? 'Update Course' : 'Create Course')}
                </Button>
            </div>
        </form>
    )
}
