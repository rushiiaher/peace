'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, UserCircle2, BookOpen, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface StudentFormProps {
    initialData?: any
    courses: any[]
    onSubmit: (data: any) => Promise<void>
    isEdit?: boolean
    loading?: boolean
    onCourseAdd?: (courseId: string) => Promise<any> // For edit mode direct actions
    onCourseRemove?: (courseId: string) => Promise<any> // For edit mode direct actions
}

export function StudentForm({
    initialData,
    courses,
    onSubmit,
    isEdit = false,
    loading = false,
    onCourseAdd,
    onCourseRemove
}: StudentFormProps) {
    const [localCourses, setLocalCourses] = useState<any[]>(initialData?.courses || [])
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.documents?.photo || null)
    const [newPhotoData, setNewPhotoData] = useState<string | null>(null)

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                setPhotoPreview(base64String)
                setNewPhotoData(base64String)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Construct base data object
        const data: any = {
            rollNo: formData.get('rollNo'),
            email: formData.get('email'),
            status: formData.get('status'),
            firstName: formData.get('firstName'),
            middleName: formData.get('middleName'),
            lastName: formData.get('lastName'),
            name: [formData.get('firstName'), formData.get('middleName'), formData.get('lastName')].filter(Boolean).join(' '),
            phone: formData.get('phone'),
            dateOfBirth: formData.get('dateOfBirth'),
            bloodGroup: formData.get('bloodGroup'),
            motherName: formData.get('motherName'), // NEW
            aadhaarCardNo: formData.get('aadhaarCardNo'), // NEW
            guardianName: formData.get('guardianName'),
            guardianPhone: formData.get('guardianPhone'),
            address: formData.get('address'),
        }

        // Handle Photo Update
        if (newPhotoData) {
            data.documents = {
                ...(initialData?.documents || {}),
                photo: newPhotoData
            }
        }

        // Password only if provided or not in edit mode
        const password = formData.get('password')
        if (password) data.password = password

        // For Add Mode: Include initial course selection
        if (!isEdit) {
            data.courses = [{
                courseId: formData.get('courseId'),
                booksIncluded: formData.get('booksIncluded') === 'true'
            }]
        }

        onSubmit(data)
    }

    // Helper for Edit Mode local state update
    const handleLocalCourseRemove = async (courseId: string) => {
        if (onCourseRemove) {
            const updatedUser = await onCourseRemove(courseId)
            if (updatedUser) setLocalCourses(updatedUser.courses)
        }
    }

    const handleLocalCourseAdd = async (courseId: string) => {
        if (onCourseAdd) {
            const updatedUser = await onCourseAdd(courseId)
            if (updatedUser) setLocalCourses(updatedUser.courses)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Account Details */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold pb-2 border-b">
                    <UserCircle2 className="w-5 h-5" />
                    <h3>Account Details</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo Upload Section */}
                    <div className="shrink-0 flex flex-col items-center space-y-3">
                        <div className="w-32 h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-muted/50 relative group">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle2 className="w-12 h-12 text-muted-foreground/50" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                title="Upload Photo"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Edit className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Upload Photo</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="rollNo">Roll Number <span className="text-destructive">*</span></Label>
                            <Input
                                id="rollNo"
                                name="rollNo"
                                defaultValue={initialData?.rollNo}
                                disabled={isEdit} // Roll No usually immutable
                                className={isEdit ? "bg-muted" : ""}
                                placeholder="ST-2024-001"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={initialData?.email}
                                placeholder="student@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{isEdit ? "Password (New)" : "Password"} <span className={!isEdit ? "text-destructive" : "hidden"}>*</span></Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required={!isEdit}
                                placeholder={isEdit ? "Leave blank to keep current" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={initialData?.status || "Active"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold pb-2 border-b">
                    <User className="w-5 h-5" />
                    <h3>Personal Info</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                            <Input id="firstName" name="firstName" defaultValue={initialData?.firstName || (initialData?.name?.split(' ')[0] || '')} placeholder="First Name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="middleName">Father/Middle Name</Label>
                            <Input id="middleName" name="middleName" defaultValue={initialData?.middleName || (initialData?.name?.split(' ').length > 2 ? initialData?.name?.split(' ').slice(1, -1).join(' ') : '')} placeholder="Father/Middle Name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Surname/Last Name <span className="text-destructive">*</span></Label>
                            <Input id="lastName" name="lastName" defaultValue={initialData?.lastName || (initialData?.name?.split(' ').length > 1 ? initialData?.name?.split(' ').slice(-1)[0] : '')} placeholder="Surname" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aadhaarCardNo">Aadhaar Card No</Label>
                        <Input id="aadhaarCardNo" name="aadhaarCardNo" defaultValue={initialData?.aadhaarCardNo} placeholder="XXXX-XXXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" defaultValue={initialData?.phone} placeholder="+91..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            defaultValue={initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : ''}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select name="bloodGroup" defaultValue={initialData?.bloodGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" defaultValue={initialData?.address} placeholder="City, State" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="motherName">Mother Name</Label>
                        <Input id="motherName" name="motherName" defaultValue={initialData?.motherName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input id="guardianName" name="guardianName" defaultValue={initialData?.guardianName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianPhone">Guardian Phone</Label>
                        <Input id="guardianPhone" name="guardianPhone" defaultValue={initialData?.guardianPhone} />
                    </div>
                </div>
            </div>

            {/* Academic / Course Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold pb-2 border-b">
                    <BookOpen className="w-5 h-5" />
                    <h3>Academic</h3>
                </div>

                {isEdit ? (
                    /* EDIT MODE: Course Management List */
                    <div className="space-y-4">
                        <div className="flex gap-2 p-4 bg-muted/40 rounded-lg border border-dashed">
                            <div className="flex-1">
                                <Label className="text-xs mb-1.5 block font-medium">Add New Course</Label>
                                <Select onValueChange={handleLocalCourseAdd}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="Select course to enroll" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses
                                            .filter((ca: any) => !localCourses.some((c: any) => (c.courseId?._id || c.courseId) === ca.courseId?._id))
                                            .map((courseAssignment: any) => (
                                                <SelectItem key={courseAssignment.courseId?._id} value={courseAssignment.courseId?._id}>
                                                    {courseAssignment.courseId?.name} ({courseAssignment.courseId?.code})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {localCourses.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-2">No courses enrolled yet</p>
                            ) : (
                                localCourses.map((course: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/5 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium">{course.courseId?.name || 'Unknown Course'}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground ml-6">Books: {course.booksIncluded ? 'Yes' : 'No'}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            type="button"
                                            className="text-destructive h-8 px-3 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleLocalCourseRemove(course.courseId?._id || course.courseId)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    /* ADD MODE: Single Course Selection */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="courseId">Assign Course <span className="text-destructive">*</span></Label>
                            <div className="space-y-1">
                                <Select name="courseId" defaultValue={initialData?.courseId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((courseAssignment: any) => (
                                            <SelectItem key={courseAssignment.courseId?._id} value={courseAssignment.courseId?._id}>
                                                {courseAssignment.courseId?.name} ({courseAssignment.courseId?.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {initialData?.courseInterested && (
                                    <p className="text-xs text-muted-foreground">Original Interest: {initialData.courseInterested}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="booksIncluded">Include Books</Label>
                            <Select name="booksIncluded" defaultValue="false">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes - Include Books</SelectItem>
                                    <SelectItem value="false">No - Course Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={loading}>
                    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                    {isEdit ? "Save Changes" : "Create Student"}
                </Button>
            </div>
        </form>
    )
}
