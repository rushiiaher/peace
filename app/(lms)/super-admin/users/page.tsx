'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" - Removed
import { toast } from "sonner"
import { Users, Building2, UserCog, GraduationCap, Plus, Edit, Trash2, Shield, Calendar } from "lucide-react"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import Loader from "@/components/ui/loader"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [institutes, setInstitutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [rollNo, setRollNo] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('')
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchUsers()
    fetchInstitutes()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutes = async () => {
    try {
      const res = await fetch('/api/institutes')
      const data = await res.json()
      setInstitutes(data)
    } catch (error) {
      toast.error('Failed to fetch institutes')
    }
  }



  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      instituteId: formData.get('instituteId') || undefined,
      status: formData.get('status')
    }

    if (data.role === 'student') {
      data.rollNo = formData.get('rollNo')
      data.courseId = formData.get('courseId') || undefined
      data.phone = formData.get('phone')
      data.address = formData.get('address')
      data.dateOfBirth = formData.get('dateOfBirth')
      data.guardianName = formData.get('guardianName')
      data.guardianPhone = formData.get('guardianPhone')
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('User created successfully')
        setAddOpen(false)
        setRollNo('')
        setSelectedRole('')
        setSelectedInstituteId('')
        fetchUsers()
        e.currentTarget.reset()
      } else {
        toast.error('Failed to create user')
      }
    } catch (error) {
      toast.error('Failed to create user')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      instituteId: formData.get('instituteId') || undefined,
      status: formData.get('status')
    }

    const password = formData.get('password')
    if (password) data.password = password

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('User updated successfully')
        setEditOpen(false)
        fetchUsers()
      } else {
        toast.error('Failed to update user')
      }
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'}`)
        fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getInstituteById = (id: string) => {
    return institutes.find((inst: any) => inst._id === id)
  }

  const filterByRole = (role: string) => {
    return users.filter((u: any) => u.role === role)
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  const totalUsers = users.length
  const activeUsers = users.filter((u: any) => u.status === 'Active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="User Management" subtitle="Manage institute admins, faculty, and students" />
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Create New User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="text-xl">Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" value={selectedRole} onValueChange={setSelectedRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="institute-admin">Institute Admin</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="instituteId">Institute {selectedRole === 'student' ? '(Required)' : '(Optional)'}</Label>
                  <Select name="instituteId" value={selectedInstituteId} onValueChange={setSelectedInstituteId} required={selectedRole === 'student'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institute" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((inst: any) => (
                        <SelectItem key={inst._id} value={inst._id}>{inst.name} ({inst.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="Active">
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

              {selectedRole === 'student' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Student Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number</Label>
                      <Input id="rollNo" name="rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="ST-2024-001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" placeholder="+91..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" placeholder="City, State" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input id="guardianName" name="guardianName" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input id="guardianPhone" name="guardianPhone" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{filterByRole('institute-admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{filterByRole('student').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center w-full pb-4">
          <AnimatedTabsProfessional
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "all", label: "All Users", count: users.length },
              { id: "institute-admin", label: "Institute Admins", count: filterByRole('institute-admin').length },
              { id: "faculty", label: "Faculty", count: filterByRole('faculty').length },
              { id: "student", label: "Students", count: filterByRole('student').length },
            ]}
          />
        </div>

        {(activeTab === 'all' ? users : filterByRole(activeTab)).map((user: any) => (
          <Card key={user._id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all">
            <div className="p-6 md:flex items-start justify-between border-b border-border/50 bg-muted/5">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-inner ${user.role === 'super-admin' ? 'bg-purple-100 text-purple-600' :
                  user.role === 'institute-admin' ? 'bg-blue-100 text-blue-600' :
                    user.role === 'faculty' ? 'bg-orange-100 text-orange-600' :
                      'bg-emerald-100 text-emerald-600'
                  }`}>
                  {user.role === 'institute-admin' ? <Building2 className="h-6 w-6" /> :
                    user.role === 'faculty' ? <UserCog className="h-6 w-6" /> :
                      user.role === 'student' ? <GraduationCap className="h-6 w-6" /> :
                        <Users className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge className={`mt-4 md:mt-0 px-3 py-1 text-sm ${user.status === 'Active'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
                : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                {user.status}
              </Badge>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Role */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Role</span>
                </div>
                <p className="font-semibold capitalize text-sm">{user.role.replace('-', ' ')}</p>
              </div>

              {/* Institute */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Institute</span>
                </div>
                <p className="font-semibold text-sm">{user.instituteId ? getInstituteById(user.instituteId)?.name || 'N/A' : 'N/A'}</p>
              </div>

              {/* Created */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created</span>
                </div>
                <p className="font-semibold text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Last Login */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last Login</span>
                </div>
                <p className="font-semibold text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setEditOpen(true); }} className="h-9 px-4 hover:bg-background shadow-sm">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStatus(user)}
                disabled={user.role === 'super-admin'}
                className="h-9 px-4 hover:bg-background shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Shield className="w-4 h-4 mr-2" /> {user.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(user._id)}
                disabled={user.role === 'super-admin'}
                className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-bold">Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedUser && (
              <form onSubmit={handleEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="font-semibold">Full Name</Label>
                    <Input id="edit-name" name="name" defaultValue={selectedUser.name} required className="h-10" disabled={selectedUser.role === 'super-admin'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="font-semibold">Email</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={selectedUser.email} required className="h-10" disabled={selectedUser.role === 'super-admin'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" selection-start="0" className="font-semibold">Password (New)</Label>
                    <Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="font-semibold">Role</Label>
                    <Select name="role" defaultValue={selectedUser.role} disabled={selectedUser.role === 'super-admin'}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="institute-admin">Institute Admin</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        {selectedUser.role === 'super-admin' && <SelectItem value="super-admin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-instituteId" className="font-semibold">Institute</Label>
                    <Select name="instituteId" defaultValue={selectedUser.instituteId} disabled={selectedUser.role === 'super-admin'}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select institute" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutes.map((inst: any) => (
                          <SelectItem key={inst._id} value={inst._id}>{inst.name} ({inst.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="font-semibold">Status</Label>
                    <Select name="status" defaultValue={selectedUser.status} disabled={selectedUser.role === 'super-admin'}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="h-10 px-6">Cancel</Button>
                  <Button type="submit" className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white">Update User</Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
