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
import { toast } from "sonner"

export default function BatchesPage() {
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  useEffect(() => {
    fetchBatches()
    fetchCourses()
    fetchInstitutes()
  }, [])

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches')
      const data = await res.json()
      setBatches(data)
    } catch (error) {
      toast.error('Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
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
    const data = {
      name: formData.get('name'),
      courseId: formData.get('courseId'),
      instituteId: formData.get('instituteId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status')
    }

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Batch created successfully')
        setAddOpen(false)
        fetchBatches()
        e.currentTarget.reset()
      }
    } catch (error) {
      toast.error('Failed to create batch')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      courseId: formData.get('courseId'),
      instituteId: formData.get('instituteId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status')
    }

    try {
      const res = await fetch(`/api/batches/${selectedBatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Batch updated successfully')
        setEditOpen(false)
        fetchBatches()
      }
    } catch (error) {
      toast.error('Failed to update batch')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return
    
    try {
      const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Batch deleted successfully')
        fetchBatches()
      }
    } catch (error) {
      toast.error('Failed to delete batch')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <SectionHeader title="Batch Management" subtitle="Organize students into batches for structured learning" />
      
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button>Create New Batch</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="name">Batch Name</Label>
              <Input id="name" name="name" required placeholder='e.g., "August Exam Event"' />
            </div>
            <div>
              <Label htmlFor="instituteId">Institute</Label>
              <Select name="instituteId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select institute" />
                </SelectTrigger>
                <SelectContent>
                  {institutes.map((inst: any) => (
                    <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="courseId">Course</Label>
              <Select name="courseId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div>
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
            <Button type="submit">Create Batch</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {batches.map((batch: any) => (
          <Card key={batch._id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{batch.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{batch.courseId?.name}</p>
                </div>
                <Badge variant={batch.status === 'Active' ? 'default' : 'secondary'}>{batch.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Institute</p>
                  <p className="font-medium">{batch.instituteId?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(batch.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(batch.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedBatch(batch)
                    setEditOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(batch._id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Batch Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedBatch.name} required />
              </div>
              <div>
                <Label htmlFor="edit-instituteId">Institute</Label>
                <Select name="instituteId" defaultValue={selectedBatch.instituteId?._id || selectedBatch.instituteId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.map((inst: any) => (
                      <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-courseId">Course</Label>
                <Select name="courseId" defaultValue={selectedBatch.courseId?._id || selectedBatch.courseId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input 
                  id="edit-startDate" 
                  name="startDate" 
                  type="date" 
                  defaultValue={new Date(selectedBatch.startDate).toISOString().split('T')[0]} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input 
                  id="edit-endDate" 
                  name="endDate" 
                  type="date" 
                  defaultValue={new Date(selectedBatch.endDate).toISOString().split('T')[0]} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={selectedBatch.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Update Batch</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
