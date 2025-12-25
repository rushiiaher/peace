'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Headphones, AlertCircle, Clock, CheckCircle, XCircle, MessageCircle, Send, User } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function InstituteAdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [instituteId, setInstituteId] = useState<string | null>(null)

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
      userRole: 'institute-admin',
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
        toast.success('Ticket created successfully')
        setCreateOpen(false)
        fetchTickets()
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
      case 'Open': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
      case 'In Progress': return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
      case 'Resolved': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
      case 'Closed': return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
      default: return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
    }
  }

  const openTickets = tickets.filter(t => t.status === 'Open').length
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Support" subtitle="Get assistance from super admin." />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">All Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total History</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Open</p>
                <p className="text-2xl font-bold">{openTickets}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending Action</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTickets}</p>
                <p className="text-xs text-muted-foreground mt-1">Being Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Resolved</p>
                <p className="text-2xl font-bold">{resolvedTickets}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Your Tickets
        </h3>
        <Button onClick={() => setCreateOpen(true)} className="shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" />New Ticket</Button>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket._id} className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-primary/30" onClick={() => { setSelectedTicket(ticket); setViewOpen(true) }}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-xs font-normal border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] h-5">{ticket.priority || 'Normal'} Priority</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 && (
          <div className="py-12 text-center border-dashed border-2 rounded-xl bg-muted/20">
            <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No support tickets found.</p>
            <Button variant="link" onClick={() => setCreateOpen(true)}>Create your first ticket</Button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl">Create Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue in detail for faster resolution.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required placeholder="e.g. Payment Issue, Bug Report" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="Normal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required rows={5} placeholder="Please provide detailed steps to reproduce the issue..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Ticket</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/10 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-xs font-normal border ${getStatusColor(selectedTicket?.status)}`}>
                {selectedTicket?.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{new Date(selectedTicket?.createdAt).toLocaleString()}</span>
            </div>
            <DialogTitle className="text-xl">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedTicket && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Description</h4>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border">
                    {selectedTicket.description}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground uppercase">Conversation History</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedTicket.replies?.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground italic">No replies yet.</p>
                  ) : (
                    selectedTicket.replies?.map((r: any, i: number) => {
                      const isMe = r.userId === userId || r.userId?._id === userId
                      return (
                        <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <div className="flex items-center justify-between gap-4 mb-1 border-b border-primary-foreground/10 pb-1">
                              <span className="font-semibold text-xs">{isMe ? 'You' : (r.userId?.name || 'Support')}</span>
                              <span className="text-[10px] opacity-70">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p>{r.message}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedTicket?.status !== 'Closed' && (
            <div className="p-4 border-t bg-muted/10 shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={1}
                  className="min-h-[40px] resize-none py-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleReply()
                    }
                  }}
                />
                <Button onClick={handleReply} size="icon" className="shrink-0 h-10 w-10">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">Press Enter to send</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
