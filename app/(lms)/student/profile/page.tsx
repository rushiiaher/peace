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

  const downloadIdCard = async () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1011 // approx credit card ratio width (3.37 inch * 300 dpi)
      canvas.height = 638 // (2.125 inch * 300 dpi)
      const ctx = canvas.getContext('2d')!

      // --- Fonts ---
      // We'll use standard fonts, approximating the look
      const fontBold = 'bold 28px Arial, sans-serif'
      const fontRegular = '26px Arial, sans-serif'
      const fontSmall = '18px Arial, sans-serif'
      const fontTitle = 'bold 36px Arial, sans-serif'
      const fontHeader = 'bold 22px Arial, sans-serif'

      // --- Background ---
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Rounded Corners for the card itself (optional if printing, but looks nice digital)
      // We represent the card within the canvas

      // --- Header System ---
      // Beige Background
      ctx.fillStyle = '#E8E0D5'
      ctx.fillRect(20, 20, canvas.width - 40, 160)

      // Blue Brand Tab (Top Right)
      ctx.fillStyle = '#008AC5' // Cyan-Blue
      ctx.fillRect(canvas.width - 320, 20, 300, 60)

      // White ID CARD Pill
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      // roundRect is not supported in all envs, using arcTo or simplified rect
      ctx.roundRect ? ctx.roundRect(canvas.width - 300, 100, 260, 50, 10) : ctx.fillRect(canvas.width - 300, 100, 260, 50)
      ctx.fill()

      // "ID CARD" Text
      ctx.fillStyle = '#D97706' // Orange-ish
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ID CARD', canvas.width - 170, 137)

      // "PEACE India | 1010" Text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('PEACE India | 1010', canvas.width - 40, 58)

      // --- Identity & Logo ---
      // Load Logo
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/Peacexperts_LOGO.png'

      try {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = (e) => { console.warn("Logo load failed", e); resolve(null) } // Continue even if logo fails
        })
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          ctx.drawImage(logoImg, 40, 30, 140, 140)
        }
      } catch (e) { console.warn("Logo drawing skipped") }

      // Institute Header Text
      ctx.fillStyle = '#D97706' // Orange Title
      ctx.textAlign = 'left'
      ctx.font = 'bold 22px Arial, sans-serif'
      // Use institute name if available, else fallback
      const instName = student.instituteId?.name || 'Professional Education Academy'
      ctx.fillText(instName, 200, 60)

      ctx.fillStyle = '#555555' // Subtitle Gray
      ctx.font = '16px Arial, sans-serif'
      ctx.fillText('For Computer Experts', 200, 85)

      const instAddress = student.instituteId?.address || 'Affiliated with Ministry of Corporate Affairs'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText(instAddress.substring(0, 60), 200, 110) // Truncate if too long

      const instContact = `Ph: ${student.instituteId?.phone || ''} | Email: ${student.instituteId?.email || ''}`
      ctx.fillText(instContact.substring(0, 60), 200, 130)

      // --- Separator Line ---
      ctx.strokeStyle = '#D1D5DB'
      ctx.lineWidth = 2
      // ctx.beginPath()
      // ctx.moveTo(20, 180); ctx.lineTo(canvas.width - 20, 180); ctx.stroke()

      // --- Student Details ---
      const startX = 50
      let startY = 240
      const lineHeight = 45

      ctx.textAlign = 'left'

      // Reg No
      ctx.fillStyle = '#0CA5B0' // Teal Value
      ctx.font = 'bold 26px Arial, sans-serif'
      ctx.fillText('Student Reg. No.:', startX, startY)
      ctx.fillStyle = '#000000'
      ctx.fillText(student.rollNo || 'N/A', startX + 230, startY)

      startY += lineHeight + 10

      // Name
      ctx.fillStyle = '#0CA5B0'
      ctx.fillText('Name:', startX, startY)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 30px Arial, sans-serif' // Name is bigger
      ctx.fillText((student.name || '').toUpperCase(), startX + 100, startY)

      startY += lineHeight + 15

      // Training Institute
      ctx.fillStyle = '#0CA5B0'
      ctx.font = 'bold 26px Arial, sans-serif'
      ctx.fillText('Training Institute:', startX, startY)
      // Wrap institute name
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 24px Arial, sans-serif'

      const maxWidth = 500
      const xOffset = startX + 230

      const fullInstName = student.instituteId?.name || 'Vision IT Professional Education Institute'
      // Simple Split if too long
      if (fullInstName.length > 30) {
        const mid = Math.floor(fullInstName.length / 2)
        const splitIdx = fullInstName.indexOf(' ', mid)
        if (splitIdx !== -1) {
          ctx.fillText(fullInstName.substring(0, splitIdx), xOffset, startY)
          ctx.fillText(fullInstName.substring(splitIdx + 1), xOffset, startY + 30)
          startY += 30
        } else {
          ctx.fillText(fullInstName, xOffset, startY)
        }
      } else {
        ctx.fillText(fullInstName, xOffset, startY)
      }

      const instituteCity = (student.instituteId?.address || '').split(',').pop()?.trim() || ''
      if (instituteCity) {
        ctx.fillText(instituteCity, xOffset, startY + 30)
        startY += 30
      }

      startY += lineHeight + 15

      // Course & Blood Group Row
      const courseName = student.courses?.[0]?.courseId?.code || student.courses?.[0]?.courseId?.name || 'N/A'

      ctx.fillStyle = '#0CA5B0'
      ctx.font = 'bold 26px Arial, sans-serif'
      ctx.fillText('Course:', startX, startY)
      ctx.fillStyle = '#000000'
      ctx.fillText(courseName, startX + 110, startY)

      // Blood Group
      if (student.bloodGroup) {
        ctx.fillStyle = '#0CA5B0'
        ctx.fillText('B. Group:', startX + 350, startY)
        ctx.fillStyle = '#000000'
        ctx.fillText(student.bloodGroup, startX + 480, startY)
      }

      startY += lineHeight + 10

      // DOB
      ctx.fillStyle = '#0CA5B0'
      ctx.fillText('DOB:', startX, startY)
      ctx.fillStyle = '#000000'
      ctx.fillText(student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', startX + 80, startY)

      startY += lineHeight + 10

      // Mobile
      ctx.fillStyle = '#0CA5B0'
      ctx.fillText('Mobile No.:', startX, startY)
      ctx.fillStyle = '#000000'
      ctx.fillText(student.phone || 'N/A', startX + 150, startY)

      // --- Student Photo (Right Side) ---
      if (student.documents?.photo) {
        const photoImg = new Image()
        photoImg.crossOrigin = 'anonymous'
        photoImg.src = student.documents.photo

        try {
          await new Promise((resolve) => { photoImg.onload = resolve; photoImg.onerror = resolve })

          // Draw Photo Box
          const photoX = canvas.width - 250
          const photoY = 220
          const photoW = 200
          const photoH = 240

          ctx.save()
          ctx.beginPath()
          ctx.rect(photoX, photoY, photoW, photoH)
          ctx.clip()
          ctx.drawImage(photoImg, photoX, photoY, photoW, photoH)
          ctx.restore()

          ctx.lineWidth = 1
          ctx.strokeStyle = '#ddd'
          ctx.strokeRect(photoX, photoY, photoW, photoH)
        } catch (e) { console.warn("Photo drawing failed") }
      }

      // --- Separator Line (Bottom) ---
      ctx.fillStyle = '#E8E0D5'
      ctx.fillRect(20, canvas.height - 40, canvas.width - 40, 20)

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
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden relative" style={{ width: '100%', aspectRatio: '1.58' }}>
            {/* Header / Background Strip */}
            <div className="absolute top-4 left-4 right-4 h-32 bg-[#E8E0D5]"></div>

            {/* Blue Brand Tab */}
            <div className="absolute top-4 right-4 w-64 h-12 bg-[#008AC5]">
              <div className="h-full flex items-center justify-end px-4 text-white font-bold text-lg">
                PEACE India | 1010
              </div>
            </div>

            {/* ID Card Pill */}
            <div className="absolute top-20 right-10 bg-white px-8 py-2 rounded-full shadow-sm">
              <span className="text-[#D97706] font-bold text-xl">ID CARD</span>
            </div>

            {/* Logo & Institute Name Area */}
            <div className="relative z-10 px-8 pt-8 flex gap-4">
              <div className="w-24 h-24 shrink-0 bg-white/50 rounded flex items-center justify-center">
                <img src="/Peacexperts_LOGO.png" alt="Logo" className="max-w-full max-h-full" />
              </div>
              <div className="pt-2">
                <h3 className="text-[#D97706] font-bold text-lg leading-tight">{student.instituteId?.name || 'Professional Education Academy'}</h3>
                <p className="text-xs text-gray-600">For Computer Experts</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs">{student.instituteId?.address || 'Affiliated with Ministry of Corporate Affairs'}</p>
                <p className="text-[10px] text-gray-700 font-semibold mt-0.5 max-w-xs">
                  Ph: {student.instituteId?.phone} | {student.instituteId?.email}
                </p>
              </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 px-10 mt-12 grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-[#0CA5B0] w-32 shrink-0">Student Reg. No.:</span>
                  <span className="font-bold">{student.rollNo || 'N/A'}</span>
                </div>
                <div className="flex gap-2 text-sm items-center">
                  <span className="font-bold text-[#0CA5B0] w-32 shrink-0">Name:</span>
                  <span className="font-bold text-lg uppercase tracking-wide">{student.name}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-[#0CA5B0] w-32 shrink-0">Training Inst.:</span>
                  <div className="font-bold text-xs uppercase leading-tight pt-0.5">
                    {student.instituteId?.name || 'Vision IT Professional Education Institute'}
                    <br /><span className="text-gray-600 font-normal normal-case">{(student.instituteId?.address || '').split(',').pop()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mt-1">
                  <div className="flex gap-2">
                    <span className="font-bold text-[#0CA5B0]">Course:</span>
                    <span className="font-bold">{student.courses?.[0]?.courseId?.code || student.courses?.[0]?.courseId?.name || 'N/A'}</span>
                  </div>
                  {student.bloodGroup && (
                    <div className="flex gap-2">
                      <span className="font-bold text-[#0CA5B0]">B. Group:</span>
                      <span className="font-bold">{student.bloodGroup}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-[#0CA5B0]">DOB:</span>
                  <span className="font-bold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-[#0CA5B0]">Mobile No.:</span>
                  <span className="font-bold">{student.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Photo */}
              <div className="col-span-1 flex justify-end items-start -mt-4">
                {student.documents?.photo ? (
                  <div className="w-32 h-40 border bg-gray-100">
                    <img src={student.documents.photo} className="w-full h-full object-cover" alt="Student" />
                  </div>
                ) : (
                  <div className="w-32 h-40 border bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    No Photo
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="absolute bottom-4 left-4 right-4 h-4 bg-[#E8E0D5]"></div>
          </div>
          <DialogFooter>
            <Button onClick={downloadIdCard}><Download className="w-4 h-4 mr-2" /> Download ID Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
