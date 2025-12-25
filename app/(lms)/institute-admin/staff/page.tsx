'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"
import { toast } from "sonner"
import { Users, UserCog, IndianRupee, Plus, Edit, Trash2, Mail, Phone, MapPin, Briefcase, GraduationCap, Calendar, Monitor, Shield, User } from "lucide-react"

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchStaff()
    }
  }, [instituteId])

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/staff?instituteId=${instituteId}`)
      const data = await res.json()
      setStaff(data)
    } catch (error) {
      toast.error('Failed to fetch staff')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role'),
      department: formData.get('department'),
      salary: Number(formData.get('salary')),
      qualification: formData.get('qualification'),
      experience: Number(formData.get('experience')),
      address: formData.get('address'),
      instituteId,
      status: 'Active'
    }

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Staff added successfully')
        setAddOpen(false)
        fetchStaff()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to add staff')
      }
    } catch (error) {
      toast.error('Failed to add staff')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role'),
      department: formData.get('department'),
      salary: Number(formData.get('salary')),
      qualification: formData.get('qualification'),
      experience: Number(formData.get('experience')),
      address: formData.get('address'),
      status: formData.get('status')
    }

    try {
      const res = await fetch(`/api/staff/${selectedStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Staff updated successfully')
        setEditOpen(false)
        fetchStaff()
      } else {
        toast.error('Failed to update staff')
      }
    } catch (error) {
      toast.error('Failed to update staff')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Staff deleted successfully')
        fetchStaff()
      } else {
        toast.error('Failed to delete staff')
      }
    } catch (error) {
      toast.error('Failed to delete staff')
    }
  }

  const facultyCount = staff.filter((s: any) => s.role === 'Faculty').length
  const adminCount = staff.filter((s: any) => s.role === 'Admin Staff').length
  const totalSalary = staff.reduce((sum: number, s: any) => sum + (s.salary || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Staff Management" subtitle="Manage faculty, admin staff, and payroll details." />

      <div className="grid gap-4 sm:grid-cols-4">
        {/* Total Staff */}
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty */}
        <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Faculty</p>
                <p className="text-2xl font-bold">{facultyCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Staff */}
        <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Admin Staff</p>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Operations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary */}
        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Payroll</p>
                <p className="text-2xl font-bold">₹{totalSalary.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <div className="flex justify-between items-center">
          <div className="flex overflow-x-auto pb-1 max-w-[calc(100%-180px)]">
            <AnimatedTabsProfessional
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: "all", label: "All Staff", count: staff.length },
                { id: "faculty", label: "Faculty", count: facultyCount },
                { id: "admin", label: "Admin Staff", count: adminCount }
              ]}
            />
          </div>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" />Add Member</Button>
          </DialogTrigger>
        </div>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl">Add New Staff Member</DialogTitle>
            <DialogDescription>Enter the details of the new faculty or staff member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. Dr. Rajesh Kumar" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="e.g. rajesh@institute.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin Staff">Admin Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="e.g. Physics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (₹)</Label>
                <Input id="salary" name="salary" type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input id="qualification" name="qualification" placeholder="e.g. PhD, M.Sc" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input id="experience" name="experience" type="number" placeholder="0" />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="Full residential address" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Create Profile</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {activeTab === 'all' && staff.length === 0 && (
          <div className="col-span-full py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No staff members added yet.</p>
          </div>
        )}

        {(activeTab === 'all' ? staff : staff.filter((s: any) => activeTab === 'faculty' ? s.role === 'Faculty' : s.role === 'Admin Staff')).map((member: any) => (
          <Card key={member._id} className="hover:shadow-md transition-shadow group overflow-hidden border-t-4 border-t-primary/30">
            <CardHeader className="pb-3 border-b bg-muted/20 fles-row">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base line-clamp-1">{member.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className={member.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate">{member.role}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="truncate">{member.department || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="truncate">{member.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="truncate">{member.qualification || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t mt-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Joined {new Date(member.createdAt || Date.now()).toLocaleDateString()}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => {
                    setSelectedStaff(member)
                    setViewOpen(true)
                  }}>
                    <User className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => {
                    setSelectedStaff(member)
                    setEditOpen(true)
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(member._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl">Edit Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedStaff.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedStaff.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedStaff.phone || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select name="role" defaultValue={selectedStaff.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Admin Staff">Admin Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input id="edit-department" name="department" defaultValue={selectedStaff.department || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Monthly Salary</Label>
                  <Input id="edit-salary" name="salary" type="number" defaultValue={selectedStaff.salary || 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-qualification">Qualification</Label>
                  <Input id="edit-qualification" name="qualification" defaultValue={selectedStaff.qualification || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-experience">Experience (Years)</Label>
                  <Input id="edit-experience" name="experience" type="number" defaultValue={selectedStaff.experience || 0} />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedStaff.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" name="address" defaultValue={selectedStaff.address || ''} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Staff</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {selectedStaff?.name?.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedStaff?.name}</DialogTitle>
                <p className="text-muted-foreground text-sm">{selectedStaff?.role}</p>
              </div>
            </div>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Department</span>
                  <p className="font-medium flex items-center gap-2"><Monitor className="w-3 h-3" /> {selectedStaff.department || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                  <div>
                    <Badge variant={selectedStaff.status === 'Active' ? 'default' : 'secondary'}>{selectedStaff.status}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Email</span>
                  <p className="font-medium text-sm flex items-center gap-2"><Mail className="w-3 h-3" /> {selectedStaff.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Phone</span>
                  <p className="font-medium text-sm flex items-center gap-2"><Phone className="w-3 h-3" /> {selectedStaff.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Salary</span>
                  <p className="font-medium flex items-center gap-2"><IndianRupee className="w-3 h-3" /> ₹{selectedStaff.salary?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Experience</span>
                  <p className="font-medium">{selectedStaff.experience} Years</p>
                </div>
              </div>

              {selectedStaff.address && (
                <div className="space-y-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Address</span>
                  <p className="font-medium text-sm flex items-start gap-2"><MapPin className="w-3 h-3 mt-1" /> {selectedStaff.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
