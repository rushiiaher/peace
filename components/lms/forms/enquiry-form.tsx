'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnquiryFormProps {
    initialData?: any
    courses: any[]
    staff: any[]
    admins: any[]
    onSubmit: (data: any) => Promise<void>
    loading?: boolean
    isEdit?: boolean
    onCancel?: () => void
}

export function EnquiryForm({
    initialData,
    courses,
    staff,
    admins,
    onSubmit,
    loading = false,
    isEdit = false,
    onCancel
}: EnquiryFormProps) {

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Process handledBy logic here or in parent? 
        // Usually form just submits raw values, parent processes API format.
        // The previous implementation split handledBy value in the submit handler.
        // Here we will pass the formatted value and let parent handle extraction if needed, 
        // but the form outputs raw form data mostly.
        // Actually, to make it clean, let's extract the object here.

        const handledByValue = formData.get('handledBy') as string
        const [handledBy, handledByModel] = handledByValue ? handledByValue.split('|') : [null, null]

        const data = {
            firstName: formData.get('firstName'),
            middleName: formData.get('middleName'),
            lastName: formData.get('lastName'),
            name: [formData.get('firstName'), formData.get('middleName'), formData.get('lastName')].filter(Boolean).join(' '),
            email: formData.get('email'),
            phone: formData.get('phone'),
            courseInterested: formData.get('courseInterested'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            followUpDate: formData.get('followUpDate'),
            source: formData.get('source'),
            handledBy,
            handledByModel
        }

        onSubmit(data)
    }

    // Helper to construct default value for handledBy select
    const getDefaultHandledBy = () => {
        if (initialData?.handledBy && initialData?.handledByModel) {
            return `${initialData.handledBy}|${initialData.handledByModel}`
        }
        return undefined
    }

    const inputClasses = "h-auto py-3 px-4 rounded-lg border-2 border-gray-200 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:border-emerald-500 focus-visible:ring-offset-0 transition-all duration-200 bg-white"
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-2"
    const sectionHeaderClasses = "text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-emerald-100"

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-6">
                <h2 className="text-3xl font-bold text-white">{isEdit ? "Edit Enquiry" : "Add New Enquiry"}</h2>
                <p className="text-emerald-50 mt-2">
                    {isEdit ? `Update details for ${initialData?.name}` : "Enter student details and assign follow-up"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                {/* Personal Information */}
                <div className="mb-8">
                    <h3 className={sectionHeaderClasses}>Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="group">
                                <Label htmlFor="firstName" className={labelClasses}>First Name <span className="text-red-500">*</span></Label>
                                <Input id="firstName" name="firstName" defaultValue={initialData?.firstName || (initialData?.name?.split(' ')[0] || '')} placeholder="Enter First Name" required className={inputClasses} />
                            </div>
                            <div className="group">
                                <Label htmlFor="middleName" className={labelClasses}>Father/Middle Name</Label>
                                <Input id="middleName" name="middleName" defaultValue={initialData?.middleName || (initialData?.name?.split(' ').length > 2 ? initialData?.name?.split(' ').slice(1, -1).join(' ') : '')} placeholder="Middle Name" className={inputClasses} />
                            </div>
                            <div className="group">
                                <Label htmlFor="lastName" className={labelClasses}>Surname/Last Name <span className="text-red-500">*</span></Label>
                                <Input id="lastName" name="lastName" defaultValue={initialData?.lastName || (initialData?.name?.split(' ').length > 1 ? initialData?.name?.split(' ').slice(-1)[0] : '')} placeholder="Last Name" required className={inputClasses} />
                            </div>
                        </div>
                        <div className="group">
                            <Label htmlFor="phone" className={labelClasses}>Phone Number <span className="text-red-500">*</span></Label>
                            <Input id="phone" name="phone" defaultValue={initialData?.phone} placeholder="+91 XXXXX XXXXX" required className={inputClasses} />
                        </div>
                        <div className="group md:col-span-2">
                            <Label htmlFor="email" className={labelClasses}>Email Address <span className="text-red-500">*</span></Label>
                            <Input id="email" name="email" type="email" defaultValue={initialData?.email} placeholder="john@example.com" required className={inputClasses} />
                        </div>
                    </div>
                </div>

                {/* Enquiry Details */}
                <div className="mb-8">
                    <h3 className={sectionHeaderClasses}>Enquiry Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <Label htmlFor="courseInterested" className={labelClasses}>Course of Interest <span className="text-red-500">*</span></Label>
                            <Select name="courseInterested" defaultValue={initialData?.courseInterested} required>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.filter((c: any) => c.enrollmentActive !== false).map((c: any) => (
                                        <SelectItem key={c._id} value={c.courseId?.name || 'Unknown'}>
                                            {c.courseId?.name} ({c.courseId?.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="group">
                            <Label htmlFor="status" className={labelClasses}>Enquiry Status</Label>
                            <Select name="status" defaultValue={initialData?.status || "New"}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="New">New</SelectItem>
                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                    <SelectItem value="Lost">Lost</SelectItem>
                                    <SelectItem value="Converted">Converted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Assignment & Follow-up */}
                <div className="mb-8">
                    <h3 className={sectionHeaderClasses}>Assignment & Follow-up</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <Label htmlFor="followUpDate" className={labelClasses}>Follow Up Date</Label>
                            <Input
                                id="followUpDate"
                                name="followUpDate"
                                type="date"
                                defaultValue={initialData?.followUpDate ? new Date(initialData.followUpDate).toISOString().split('T')[0] : ''}
                                className={inputClasses}
                            />
                        </div>
                        <div className="group">
                            <Label htmlFor="source" className={labelClasses}>Source of Enquiry</Label>
                            <Select name="source" defaultValue={initialData?.source || "Direct"}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Newspaper">Newspaper</SelectItem>
                                    <SelectItem value="Digital Media">Digital Media</SelectItem>
                                    <SelectItem value="Friend">Friend</SelectItem>
                                    <SelectItem value="Flyers">Flyers</SelectItem>
                                    <SelectItem value="Ad">Advertisement</SelectItem>
                                    <SelectItem value="Direct">Direct/Walk-in</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="group md:col-span-2">
                            <Label htmlFor="handledBy" className={labelClasses}>Assigned To</Label>
                            <Select name="handledBy" defaultValue={getDefaultHandledBy()}>
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {admins.map((admin) => (
                                        <SelectItem key={admin._id} value={`${admin._id}|User`}>
                                            {admin.name} (Admin)
                                        </SelectItem>
                                    ))}
                                    {staff.map((member) => (
                                        <SelectItem key={member._id} value={`${member._id}|Staff`}>
                                            {member.name} ({member.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mb-8">
                    <h3 className={sectionHeaderClasses}>Additional Information</h3>
                    <div className="group">
                        <Label htmlFor="notes" className={labelClasses}>Notes / Remarks</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={initialData?.notes}
                            placeholder="Add important notes or remarks..."
                            rows={4}
                            className={`${inputClasses} resize-none`}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-gray-100">
                    {onCancel && (
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 h-auto rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 h-auto rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200 border-0"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                        {isEdit ? "Save Changes" : "Create Enquiry"}
                    </Button>
                </div>
            </form>

            <p className="text-center text-sm text-gray-500 pb-6">
                Fields marked with <span className="text-red-500">*</span> are required
            </p>
        </div>
    )

}
