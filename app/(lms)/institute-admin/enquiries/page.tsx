'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { toast } from "sonner"
import { UserPlus, Mail, Phone, BookOpen, Calendar, Plus, Edit, Trash2, Clock, User } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [handlers, setHandlers] = useState<Map<string, any>>(new Map())
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchEnquiries()
    fetchStaffAndAdmins()
  }, [])

  const fetchEnquiries = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const res = await fetch(`/api/enquiries?instituteId=${user.instituteId}`)
      const data = await res.json()
      setEnquiries(Array.isArray(data) ? data : [])
      await fetchHandlers(data)
    } catch (error) {
      toast.error('Failed to fetch enquiries')
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffAndAdmins = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const [staffRes, adminRes] = await Promise.all([
        fetch(`/api/staff?instituteId=${user.instituteId}`),
        fetch(`/api/users?instituteId=${user.instituteId}&role=institute-admin`)
      ])
      const staffData = await staffRes.json()
      const adminData = await adminRes.json()
      setStaff(staffData.filter((s: any) => s.status === 'Active'))
      setAdmins(adminData)
    } catch (error) {
      console.error('Failed to fetch staff/admins')
    }
  }

  const fetchHandlers = async (enquiries: any[]) => {
    const handlerMap = new Map()
    for (const enquiry of enquiries) {
      if (enquiry.handledBy && enquiry.handledByModel) {
        const key = `${enquiry.handledBy}-${enquiry.handledByModel}`
        if (!handlerMap.has(key)) {
          try {
            const endpoint = enquiry.handledByModel === 'User' ? '/api/users' : '/api/staff'
            const res = await fetch(`${endpoint}/${enquiry.handledBy}`)
            if (res.ok) {
              const data = await res.json()
              handlerMap.set(key, data)
            }
          } catch (error) {
            console.error('Failed to fetch handler')
          }
        }
      }
    }
    setHandlers(handlerMap)
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const handledByValue = formData.get('handledBy') as string
    const [handledBy, handledByModel] = handledByValue ? handledByValue.split('|') : [null, null]

    const data = {
      instituteId: user.instituteId,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      courseInterested: formData.get('courseInterested'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      followUpDate: formData.get('followUpDate'),
      handledBy,
      handledByModel
    }

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Enquiry added successfully')
        setAddOpen(false)
        fetchEnquiries()
        e.currentTarget.reset()
      }
    } catch (error) {
      toast.error('Failed to add enquiry')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const handledByValue = formData.get('handledBy') as string
    const [handledBy, handledByModel] = handledByValue ? handledByValue.split('|') : [null, null]

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      courseInterested: formData.get('courseInterested'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      followUpDate: formData.get('followUpDate'),
      handledBy,
      handledByModel
    }

    try {
      const res = await fetch(`/api/enquiries/${selectedEnquiry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Enquiry updated successfully')
        setEditOpen(false)
        fetchEnquiries()
      }
    } catch (error) {
      toast.error('Failed to update enquiry')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Enquiry deleted successfully')
        fetchEnquiries()
      }
    } catch (error) {
      toast.error('Failed to delete enquiry')
    }
  }

  const filterByStatus = (status: string) => enquiries.filter((e: any) => e.status === status)

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalEnquiries = enquiries.length
  const newEnquiries = filterByStatus('New').length
  const contactedEnquiries = filterByStatus('Contacted').length
  const convertedEnquiries = filterByStatus('Converted').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Enquiry Management" subtitle="Manage student enquiries" />
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Add Enquiry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Enquiry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="+91..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseInterested">Course of Interest</Label>
                  <Input id="courseInterested" name="courseInterested" placeholder="e.g. JEE Mains" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Enquiry Status</Label>
                  <Select name="status" defaultValue="New">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow Up Date</Label>
                  <Input id="followUpDate" name="followUpDate" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handledBy">Assigned To</Label>
                <Select name="handledBy">
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Remarks</Label>
                <Textarea id="notes" name="notes" placeholder="Additional details..." rows={3} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Create Enquiry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enquiries</p>
                <p className="text-2xl font-bold text-blue-950 dark:text-blue-100">{totalEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-100 dark:border-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New / Pending</p>
                <p className="text-2xl font-bold text-orange-950 dark:text-orange-100">{newEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-950 dark:text-purple-100">{contactedEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-green-950 dark:text-green-100">{convertedEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-6">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "all", label: "All Enquiries", count: totalEnquiries },
            { id: "New", label: "New", count: newEnquiries },
            { id: "Contacted", label: "Contacted", count: contactedEnquiries },
            { id: "Converted", label: "Converted", count: convertedEnquiries },
            { id: "Lost", label: "Lost", count: filterByStatus('Lost').length },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(activeTab === 'all' ? enquiries : filterByStatus(activeTab)).map((enq: any) => {
          // Helper to get status color
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'New': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
              case 'Contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
              case 'Converted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
              case 'Lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
              default: return 'bg-gray-100 text-gray-700';
            }
          }

          return (
            <Card key={enq._id} className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group overflow-hidden border-muted/60">
              <div className={`h-1.5 w-full ${enq.status === 'Converted' ? 'bg-green-500' : enq.status === 'Lost' ? 'bg-red-500' : enq.status === 'Contacted' ? 'bg-purple-500' : 'bg-orange-500'}`} />
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{enq.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" /> {enq.phone}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(enq.status)} border shadow-sm`}>
                    {enq.status}
                  </Badge>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2.5 text-sm p-2 rounded-md bg-muted/40">
                    <div className="p-1.5 bg-background rounded-md shadow-sm">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-medium truncate">{enq.courseInterested}</span>
                  </div>

                  {enq.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{enq.email}</span>
                    </div>
                  )}

                  {enq.followUpDate && (
                    <div className="flex items-center gap-2 text-sm px-1 text-orange-600 dark:text-orange-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Follow up: {new Date(enq.followUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 mt-1 flex items-center gap-2 border-t border-dashed">
                  <Button
                    className="flex-1 h-8 text-xs font-medium"
                    variant="outline"
                    onClick={() => { setSelectedEnquiry(enq); setEditOpen(true) }}
                  >
                    Edit Details
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={() => handleDelete(enq._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {/* Empty state */}
        {(activeTab === 'all' ? enquiries : filterByStatus(activeTab)).length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No enquiries found in {activeTab === 'all' ? 'total' : activeTab}</p>
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Enquiry Details</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedEnquiry.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedEnquiry.phone} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedEnquiry.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-courseInterested">Course of Interest</Label>
                  <Input id="edit-courseInterested" name="courseInterested" defaultValue={selectedEnquiry.courseInterested} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedEnquiry.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-followUpDate">Follow Up Date</Label>
                  <Input
                    id="edit-followUpDate"
                    name="followUpDate"
                    type="date"
                    defaultValue={selectedEnquiry?.followUpDate ? new Date(selectedEnquiry.followUpDate).toISOString().split('T')[0] : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-handledBy">Assigned To</Label>
                <Select name="handledBy" defaultValue={selectedEnquiry.handledBy && selectedEnquiry.handledByModel ? `${selectedEnquiry.handledBy}|${selectedEnquiry.handledByModel}` : undefined}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes / Remarks</Label>
                <Textarea id="edit-notes" name="notes" rows={3} defaultValue={selectedEnquiry.notes} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
