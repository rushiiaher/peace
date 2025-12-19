'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'

export default function AddEnquiry() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    courseInterested: '',
    address: '',
    notes: '',
    source: '',
    followUpDate: '',
    handledBy: '',
    handledByModel: ''
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchCourses()
      fetchStaff()
      fetchAdmins()
    }
  }, [instituteId])

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/courses?instituteId=${instituteId}`)
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error('Failed to fetch courses')
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/staff?instituteId=${instituteId}`)
      const data = await res.json()
      setStaff(data.filter((s: any) => s.status === 'Active'))
    } catch (error) {
      console.error('Failed to fetch staff')
    }
  }

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`/api/users?instituteId=${instituteId}&role=institute-admin`)
      const data = await res.json()
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch admins')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, instituteId })
      })

      if (res.ok) {
        toast.success('Enquiry added successfully')
        router.push('/enquiry/list')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to add enquiry')
      }
    } catch (error) {
      toast.error('Failed to add enquiry')
    } finally {
      setLoading(false)
    }
  }

  const handleHandlerChange = (value: string) => {
    const [id, model] = value.split('|')
    setFormData({ ...formData, handledBy: id, handledByModel: model })
  }

  return (
    <section className="space-y-6">
      <SectionHeader title="Add Enquiry" subtitle="Record new student enquiries and track lead generation." />
      <form onSubmit={handleSubmit} className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>Name *</Label>
          <Input 
            placeholder="Student's full name" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Email *</Label>
          <Input 
            type="email"
            placeholder="Email address" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Mobile No *</Label>
          <Input 
            type="tel" 
            placeholder="Contact number" 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Course Interested *</Label>
          <Select value={formData.courseInterested} onValueChange={(value) => setFormData({ ...formData, courseInterested: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course.name}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Address</Label>
          <Textarea 
            placeholder="Complete address" 
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Note</Label>
          <Textarea 
            placeholder="Manual notes about enquiry" 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Source</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {["Friend", "Newspaper", "Social Media", "TV Cable", "Website", "Walk-in"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Next Follow-up Date</Label>
          <Input 
            type="date" 
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Handled By</Label>
          <Select onValueChange={handleHandlerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff or admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" disabled>Institute Admins</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin._id} value={`${admin._id}|User`}>
                  {admin.name} (Admin)
                </SelectItem>
              ))}
              <SelectItem value="" disabled>Staff Members</SelectItem>
              {staff.map((member) => (
                <SelectItem key={member._id} value={`${member._id}|Staff`}>
                  {member.name} ({member.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Enquiry'}
        </Button>
      </form>
    </section>
  )
}
