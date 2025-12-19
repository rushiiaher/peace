'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Headphones, AlertCircle, Clock, CheckCircle, MessageCircle, Send } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function StudentSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserId(userData.id || userData._id)
      setInstituteId(userData.instituteId)
    }
  }, [])

  useEffect(() => {
    if (userId) fetchTickets()
  }, [userId])

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/support-tickets?userId=${userId}`)
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      userId,
      userRole: 'student',
      instituteId,
      subject: formData.get('subject'),
      description: formData.get('description'),
      priority: formData.get('priority')
    }

    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Ticket created')
        setCreateOpen(false)
        fetchTickets()
        e.currentTarget.reset()
      }
    } catch (error) {
      toast.error('Failed to create ticket')
    }
  }

  const handleReply = async () => {
    if (!reply.trim()) return

    const updatedReplies = [...(selectedTicket.replies || []), {
      userId,
      message: reply,
      createdAt: new Date()
    }]

    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replies: updatedReplies })
      })
      if (res.ok) {
        toast.success('Reply sent')
        setReply('')
        fetchTickets()
        const updated = await res.json()
        setSelectedTicket(updated)
      }
    } catch (error) {
      toast.error('Failed to send reply')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'destructive'
      case 'In Progress': return 'default'
      case 'Resolved': return 'secondary'
      case 'Closed': return 'outline'
      default: return 'default'
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  const openTickets = tickets.filter(t => t.status === 'Open').length
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SectionHeader title="Support" subtitle="Get help with your issues" />
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />New Ticket</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold mt-2">{tickets.length}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Headphones className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-3xl font-bold mt-2">{openTickets}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-2">{inProgressTickets}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold mt-2">{resolvedTickets}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Card key={ticket._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedTicket(ticket); setViewOpen(true) }}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{ticket.subject}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description.substring(0, 100)}...</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No tickets yet</CardContent></Card>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required placeholder="Brief description of issue" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required rows={4} placeholder="Detailed description" />
            </div>
            <Button type="submit" className="w-full">Submit Ticket</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedTicket?.subject}</DialogTitle></DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <Badge variant={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket.description}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Replies</p>
                <div className="space-y-3">
                  {selectedTicket.replies?.map((r: any, i: number) => (
                    <div key={i} className="bg-muted p-3 rounded">
                      <p className="text-sm font-medium">{r.userId?.name || 'User'}</p>
                      <p className="text-sm mt-1">{r.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTicket.status !== 'Closed' && (
                <div className="space-y-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." rows={3} />
                  <Button onClick={handleReply} className="w-full"><Send className="w-4 h-4 mr-2" />Send Reply</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
