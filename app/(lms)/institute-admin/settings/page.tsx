'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Settings, Building2, Mail, Phone, MapPin, Monitor, Edit, Plus, Trash2, Clock, CheckCircle2 } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function SettingsPage() {
  const [institute, setInstitute] = useState<any>(null)

  const [systemsOpen, setSystemsOpen] = useState(false)
  const [timingsOpen, setTimingsOpen] = useState(false)
  const [newSystem, setNewSystem] = useState('')
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (!instituteId) return
    fetch(`/api/institutes/${instituteId}`)
      .then(res => res.json())
      .then(setInstitute)
  }, [instituteId])



  const handleAddSystem = async () => {
    if (!newSystem.trim()) {
      toast.error('Please enter a system name')
      return
    }

    if (!instituteId) {
      toast.error('Institute ID not found')
      return
    }

    try {
      const updatedSystems = [...(institute.systems || []), { name: newSystem.trim(), status: 'Available' }]

      const res = await fetch(`/api/institutes/${instituteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systems: updatedSystems })
      })

      if (res.ok) {
        const updated = await res.json()
        setInstitute(updated)
        setNewSystem('')
        toast.success('System added')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to add system')
      }
    } catch (error) {
      toast.error('Failed to add system')
    }
  }

  const handleRemoveSystem = async (index: number) => {
    const systems = [...(institute.systems || [])]
    systems.splice(index, 1)

    try {
      const res = await fetch(`/api/institutes/${instituteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systems })
      })

      if (res.ok) {
        const updated = await res.json()
        setInstitute(updated)
        toast.success('System removed')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to remove system')
      }
    } catch (error) {
      toast.error('Failed to remove system')
    }
  }

  const handleUpdateTimings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const examTimings = {
      openingTime: formData.get('openingTime'),
      closingTime: formData.get('closingTime')
    }

    try {
      const res = await fetch(`/api/institutes/${instituteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examTimings })
      })
      if (res.ok) {
        const updated = await res.json()
        setInstitute(updated)
        toast.success('Timings updated')
        setTimingsOpen(false)
      }
    } catch (error) {
      toast.error('Failed to update timings')
    }
  }

  if (!institute) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Configure your institute profile, systems, and operational details." />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="hover:shadow-md transition-shadow md:col-span-2 overflow-hidden border-t-4 border-t-primary/50">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Institute Profile</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage your institute's public information</p>
                </div>
              </div>

            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">Institute Name</Label>
                    <p className="font-semibold text-base">{institute.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">Institute Code</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{institute.code}</p>
                      <Badge variant="outline" className="text-[10px] h-5">Verified</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{institute.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">Contact Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{institute.phone}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-muted-foreground font-normal">Location</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{institute.location}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-muted-foreground font-normal">Full Address</Label>
                    <p className="leading-relaxed bg-muted/20 p-3 rounded-lg border">{institute.address || 'Address not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Systems Card */}
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full border-t-4 border-t-blue-500/50">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Exam Systems</CardTitle>
                  <p className="text-xs text-muted-foreground">Manage exam terminals</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSystemsOpen(true)} className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">Total Systems</div>
              <Badge variant="secondary" className="px-2">{institute.systems?.length || 0}</Badge>
            </div>

            {institute.systems?.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {institute.systems.slice(0, 12).map((sys: any, i: number) => (
                  <div key={i} className="p-2 border rounded-md text-center text-xs font-medium bg-background shadow-sm">
                    {sys.name}
                  </div>
                ))}
                {institute.systems.length > 12 && (
                  <div className="p-2 border border-dashed rounded-md text-center text-xs text-muted-foreground flex items-center justify-center">
                    +{institute.systems.length - 12} more
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No systems configured.
              </div>
            )}
            <Button variant="outline" className="w-full mt-6" onClick={() => setSystemsOpen(true)}>Manage Systems</Button>
          </CardContent>
        </Card>

        {/* Timings Card */}
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full border-t-4 border-t-green-500/50">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Operational Hours</CardTitle>
                  <p className="text-xs text-muted-foreground">Set exam availability times</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTimingsOpen(true)} className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="text-sm font-medium">Opening Time</div>
                <div className="font-mono text-lg font-bold text-primary bg-background px-3 py-1 rounded border">{institute.examTimings?.openingTime || '09:00'}</div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="text-sm font-medium">Closing Time</div>
                <div className="font-mono text-lg font-bold text-primary bg-background px-3 py-1 rounded border">{institute.examTimings?.closingTime || '18:00'}</div>
              </div>
            </div>
            <div className="mt-6 flex gap-2 items-start p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Exams will be automatically restricted to these operational hours.</p>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Manage Systems Dialog */}
      <Dialog open={systemsOpen} onOpenChange={setSystemsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Exam Systems</DialogTitle>
            <DialogDescription>Add or remove computer terminals available for exams.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 py-4">
            <div className="relative flex-1">
              <Monitor className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter system identifier (e.g., Lab-A-01)"
                value={newSystem}
                onChange={(e) => setNewSystem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSystem()
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button type="button" onClick={handleAddSystem}><Plus className="w-4 h-4 mr-2" />Add System</Button>
          </div>

          <div className="border rounded-lg flex-1 overflow-hidden flex flex-col">
            <div className="bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase border-b flex justify-between">
              <span>System Name</span>
              <span>Action</span>
            </div>
            <div className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[200px]">
              {(!institute.systems || institute.systems.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                  <Monitor className="w-8 h-8" />
                  <p className="text-sm">No systems added yet</p>
                </div>
              ) : (
                institute.systems.map((sys: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-6 h-6 flex items-center justify-center bg-muted rounded text-muted-foreground">{i + 1}</span>
                      <span className="font-medium text-sm">{sys.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveSystem(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="bg-muted/20 px-4 py-2 border-t text-xs text-muted-foreground text-center">
              Total: {institute.systems?.length || 0} systems
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setSystemsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Timings Dialog */}
      <Dialog open={timingsOpen} onOpenChange={setTimingsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Operational Hours</DialogTitle>
            <DialogDescription>Set the daily start and end time for exams.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTimings} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input name="openingTime" type="time" defaultValue={institute.examTimings?.openingTime || '09:00'} required className="text-center font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input name="closingTime" type="time" defaultValue={institute.examTimings?.closingTime || '18:00'} required className="text-center font-mono" />
              </div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground text-center">
              Configure when students can start their exams.
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTimingsOpen(false)}>Cancel</Button>
              <Button type="submit">Update Timings</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
