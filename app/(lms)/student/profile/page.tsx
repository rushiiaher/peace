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

  const downloadIdCard = async () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1011 // approx credit card ratio width (3.37 inch * 300 dpi)
      canvas.height = 638 // (2.125 inch * 300 dpi)
      const ctx = canvas.getContext('2d')!

      // --- Background ---
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // --- Header System ---
      // Premium Background Gradient
      const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      headerGradient.addColorStop(0, '#fdfbfb')
      headerGradient.addColorStop(1, '#ebedee')
      ctx.fillStyle = headerGradient
      ctx.fillRect(20, 20, canvas.width - 40, 180)

      // White ID CARD Pill
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(0,0,0,0.1)'
      const pillX = canvas.width - 280
      const pillY = 40
      const pillW = 240
      const pillH = 60
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillW, pillH, 30)
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH)
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // "ID CARD" Text
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ID CARD', pillX + pillW / 2, pillY + 42)

      // --- Identity & Logo ---
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/Peacexperts_LOGO.png'

      try {
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = () => resolve(null)
        })
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          ctx.beginPath()
          ctx.arc(110, 110, 80, 0, Math.PI * 2)
          ctx.fillStyle = '#fff'
          ctx.fill()
          ctx.drawImage(logoImg, 40, 40, 140, 140)
        }
      } catch (e) { console.warn("Logo drawing skipped") }

      // Institute Header Text
      ctx.fillStyle = '#c2410c'
      ctx.textAlign = 'left'
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif'
      const instName = student.instituteId?.name || 'Professional Education Academy'
      ctx.fillText(instName.toUpperCase(), 200, 65)

      // AFFILIATION TEXT
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif'
      const affilText1 = "Affiliated with Ministry of Corporate Affairs (Govt. of India) &"
      const affilText2 = "An ISO:9001:2015 Certified Company"
      const regOffice = "Reg. Office: Nashik"

      ctx.fillText(affilText1, 200, 92)
      ctx.fillText(affilText2, 200, 110)
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
      ctx.fillText(regOffice, 200, 135)

      const instContact = `Ph: ${student.instituteId?.phone || ''} | Email: ${student.instituteId?.email || ''}`
      ctx.font = 'italic 13px "Segoe UI", Arial, sans-serif'
      ctx.fillText(instContact, 200, 165)

      // --- Student Details ---
      const startX = 50
      let startY = 260
      const lineHeight = 55

      // Helper for labels
      const drawLabel = (label: string, value: string, x: number, y: number, valueColor = '#000') => {
        ctx.fillStyle = '#0891b2'
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif'
        ctx.fillText(label, x, y)
        const metrics = ctx.measureText(label)
        ctx.fillStyle = valueColor
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'
        ctx.fillText(value, x + metrics.width + 15, y)
      }

      drawLabel('Reg No.:', student.rollNo || 'N/A', startX, startY)
      startY += lineHeight

      ctx.fillStyle = '#0891b2'
      ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif'
      ctx.fillText('Name:', startX, startY)
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif'
      ctx.fillText((student.name || '').toUpperCase(), startX + 90, startY)
      startY += lineHeight + 5

      drawLabel('Training Institute:', student.instituteId?.name || 'N/A', startX, startY)
      if (student.instituteId?.address) {
        startY += 30
        ctx.font = 'italic 18px "Segoe UI", Arial, sans-serif'
        ctx.fillStyle = '#64748b'
        ctx.fillText(student.instituteId.address.substring(0, 60), startX + 210, startY)
      }
      startY += lineHeight

      drawLabel('Course:', student.courses?.[0]?.courseId?.name || 'N/A', startX, startY)
      if (student.bloodGroup) {
        drawLabel('B. Group:', student.bloodGroup, startX + 450, startY, '#be123c')
      }
      startY += lineHeight

      drawLabel('DOB:', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', startX, startY)
      startY += lineHeight

      drawLabel('Mobile No.:', student.phone || 'N/A', startX, startY)

      // --- Student Photo (Right Side) ---
      if (student.documents?.photo) {
        const photoImg = new Image()
        photoImg.crossOrigin = 'anonymous'
        photoImg.src = student.documents.photo

        try {
          await new Promise((resolve) => { photoImg.onload = resolve; photoImg.onerror = resolve })

          const photoX = canvas.width - 260
          const photoY = 230
          const photoW = 210
          const photoH = 260

          // Premium Border
          ctx.strokeStyle = '#0891b2'
          ctx.lineWidth = 6
          ctx.strokeRect(photoX - 5, photoY - 5, photoW + 10, photoH + 10)

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.strokeRect(photoX - 1, photoY - 1, photoW + 2, photoH + 2)

          ctx.drawImage(photoImg, photoX, photoY, photoW, photoH)
        } catch (e) { console.warn("Photo drawing failed") }
      }

      // --- Footer Bar ---
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, canvas.height - 30, canvas.width, 30)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('VALID IDENTITY CARD - PROFESSIONAL EDUCATION ACADEMY', canvas.width / 2, canvas.height - 10)

      // Download
      const link = document.createElement('a')
      link.download = `ID_CARD_${student.rollNo || 'student'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('ID Card downloaded')

    } catch (error) {
      console.error("ID Card Generation Error", error)
      toast.error('Failed to generate ID Card')
    }
  }

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>
  if (!student) return <div className="flex items-center justify-center h-96">No profile found</div>

  return (
    <div className="space-y-6">
      <SectionHeader title="My Profile" subtitle="Manage your personal information and documents" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden relative bg-muted flex items-center justify-center">
                {student.documents?.photo ? (
                  <img src={student.documents.photo} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">{student.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Personal Details</p>
              </div>
              {/* Read Only Access - Edit Button Removed */}
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
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900 rounded-lg">
                  <User className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mother Name</p>
                  <p className="text-base font-medium">{student.motherName || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Aadhaar No</p>
                  <p className="text-base font-medium font-mono">{student.aadhaarCardNo || 'N/A'}</p>
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
            <CardContent className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg border border-dashed text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Student Identity Card</p>
                <p className="text-xs text-muted-foreground mt-1">Download your official institute identity card.</p>
              </div>
              <Button className="w-full" onClick={downloadIdCard}>
                <Download className="w-4 h-4 mr-2" /> Download ID Card
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


    </div>
  )
}
