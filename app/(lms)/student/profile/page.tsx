'use client'

import { useState, useEffect, useRef } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Download, Upload, Eye, User, Mail, Phone, Calendar, MapPin, Hash, Shield, FileText } from 'lucide-react'
import Loader from "@/components/ui/loader"

export default function ProfilePage() {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [idCardDialogOpen, setIdCardDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [documentForm, setDocumentForm] = useState({ type: 'photo', file: null as File | null, idProofType: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        toast.error('User not logged in')
        return
      }
      const user = JSON.parse(userStr)
      console.log('User from localStorage:', user)
      const res = await fetch(`/api/students?userId=${user.id}`)
      const data = await res.json()
      console.log('API Response:', res.status, data)
      if (res.ok) {
        setStudent(data)
        setEditForm(data)
      } else {
        toast.error(data.error || 'Failed to fetch profile')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (res.ok) {
        setStudent(data)
        setEditDialogOpen(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    try {
      const res = await fetch(`/api/students/${student._id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordDialogOpen(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Password changed successfully')
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('Failed to change password')
    }
  }

  const handleDocumentUpload = async () => {
    if (!documentForm.file) {
      toast.error('Please select a file')
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', documentForm.file)
      formData.append('documentType', documentForm.type)
      if (documentForm.type === 'idProof' && documentForm.idProofType) {
        formData.append('idProofType', documentForm.idProofType)
      }
      const res = await fetch(`/api/students/${student._id}/documents`, {
        method: 'PUT',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setStudent(data)
        setDocumentDialogOpen(false)
        setDocumentForm({ type: 'photo', file: null, idProofType: '' })
        toast.success('Document uploaded successfully')
      } else {
        toast.error(data.error || 'Failed to upload document')
      }
    } catch (error) {
      toast.error('Failed to upload document')
    }
  }

  const downloadIdCard = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 380
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#1e40af'
    ctx.fillRect(0, 0, 600, 380)
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(0, 0, 600, 80)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('STUDENT ID CARD', 180, 50)

    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.fillText(`Name: ${student?.name || 'N/A'}`, 40, 140)
    ctx.fillText(`Roll No: ${student?.rollNo || 'N/A'}`, 40, 180)
    ctx.fillText(`Email: ${student?.email || 'N/A'}`, 40, 220)
    ctx.fillText(`Phone: ${student?.phone || 'N/A'}`, 40, 260)
    ctx.fillText(`DOB: ${student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}`, 40, 300)

    const link = document.createElement('a')
    link.download = `id-card-${student?.rollNo || 'student'}.png`
    link.href = canvas.toDataURL()
    link.click()
    toast.success('ID Card downloaded')
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
  if (!student) return <div className="flex items-center justify-center h-96">No profile found</div>

  return (
    <div className="space-y-6">
      <SectionHeader title="My Profile" subtitle="Manage your personal information and documents" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">Personal Details</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>Edit Details</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Full Name</p>
                  <p className="text-base font-semibold text-foreground">{student.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Student ID</p>
                  <Badge variant="outline" className="font-mono bg-muted/50">{student.rollNo || 'N/A'}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                  <p className="text-base font-medium">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                  <p className="text-base font-medium">{student.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date of Birth</p>
                  <p className="text-base font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enrollment Date</p>
                  <p className="text-base font-medium">{new Date(student.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Guardian Name</p>
                  <p className="text-base font-medium">{student.guardianName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 dark:bg-teal-900 rounded-lg">
                  <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Guardian Phone</p>
                  <p className="text-base font-medium">{student.guardianPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </p>
              <p className="font-medium bg-muted/30 p-3 rounded-lg border">{student.address || 'N/A'}</p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPasswordDialogOpen(true)}>Change Password</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Digital ID Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => setIdCardDialogOpen(true)}>
                {student.documents?.photo ? (
                  <img src={student.documents.photo} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <p className="text-sm text-muted-foreground">Click to preview ID Card</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" size="sm" onClick={downloadIdCard}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
                <Button className="flex-1" size="sm" variant="outline" onClick={() => setIdCardDialogOpen(true)}>
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Photo</span>
                <Badge variant={student.documents?.photo ? 'default' : 'secondary'}>
                  {student.documents?.photo ? 'Uploaded' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>ID Proof ({student.documents?.idProofType || 'N/A'})</span>
                <Badge variant={student.documents?.idProof ? 'default' : 'secondary'}>
                  {student.documents?.idProof ? 'Uploaded' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificates</span>
                <Badge variant={student.documents?.certificates?.length ? 'default' : 'secondary'}>
                  {student.documents?.certificates?.length || 0} Files
                </Badge>
              </div>
              <Button className="w-full" size="sm" variant="outline" onClick={() => setDocumentDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-1" /> Upload Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Roll Number</Label>
                <Input value={editForm.rollNo || ''} onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
              </div>
              <div>
                <Label>Guardian Name</Label>
                <Input value={editForm.guardianName || ''} onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })} />
              </div>
              <div>
                <Label>Guardian Phone</Label>
                <Input value={editForm.guardianPhone || ''} onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordChange}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Document Type</Label>
              <Select value={documentForm.type} onValueChange={(value) => setDocumentForm({ ...documentForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="idProof">ID Proof</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {documentForm.type === 'idProof' && (
              <div>
                <Label>ID Proof Type</Label>
                <Select value={documentForm.idProofType} onValueChange={(value) => setDocumentForm({ ...documentForm, idProofType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="PAN">PAN Card</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Select File</Label>
              <Input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDocumentUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={idCardDialogOpen} onOpenChange={setIdCardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Digital ID Card Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-lg text-white">
            <div className="bg-blue-500 p-4 rounded-t-lg text-center mb-6">
              <h2 className="text-2xl font-bold">STUDENT ID CARD</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 flex items-center justify-center">
                {student.documents?.photo ? (
                  <img src={student.documents.photo} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">No Photo</div>
                )}
              </div>
              <div className="col-span-2 space-y-3">
                <div>
                  <p className="text-sm opacity-80">Name</p>
                  <p className="text-lg font-semibold">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Roll Number</p>
                  <p className="text-lg font-semibold">{student.rollNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Email</p>
                  <p className="text-lg font-semibold">{student.email}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Phone</p>
                  <p className="text-lg font-semibold">{student.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Date of Birth</p>
                  <p className="text-lg font-semibold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={downloadIdCard}><Download className="w-4 h-4 mr-2" /> Download ID Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
