'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Headphones, MessageCircle, Clock, CheckCircle, AlertCircle, XCircle, Send, User, Building2, Calendar, Tag, AlertTriangle } from "lucide-react"
import Loader from "@/components/ui/loader"

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserId(userData.id || userData._id)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support-tickets')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
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

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success('Status updated')
        fetchTickets()
        const updated = await res.json()
        setSelectedTicket(updated)
      }
    } catch (error) {
      toast.error('Failed to update status')
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

  const filterTickets = (status: string) => {
    if (status === 'all') return tickets
    return tickets.filter(t => t.status === status)
  }

  const openTickets = filterTickets('Open').length
  const inProgressTickets = filterTickets('In Progress').length
  const resolvedTickets = filterTickets('Resolved').length

  if (loading) return <div className="flex bg-muted/10 h-[calc(100vh-140px)] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-7 h-7" />
            Support & Tickets
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and resolve support tickets from institutes and students</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="Open">Open ({filterTickets('Open').length})</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress ({filterTickets('In Progress').length})</TabsTrigger>
          <TabsTrigger value="Resolved">Resolved ({filterTickets('Resolved').length})</TabsTrigger>
        </TabsList>

        {['all', 'Open', 'In Progress', 'Resolved'].map(status => (
          <TabsContent key={status} value={status} className="space-y-3 mt-4">
            {filterTickets(status).map((ticket) => {
              const priorityConfig = {
                'High': { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle },
                'Medium': { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
                'Low': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: MessageCircle }
              }[ticket.priority as 'High' | 'Medium' | 'Low'] || { color: 'bg-gray-100 text-gray-700', icon: MessageCircle }

              const statusConfig = {
                'Open': { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', icon: AlertCircle, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900' },
                'In Progress': { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800', icon: Clock, iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900' },
                'Resolved': { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', icon: CheckCircle, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900' },
                'Closed': { bg: 'bg-gray-50 dark:bg-gray-950', border: 'border-gray-200 dark:border-gray-800', icon: XCircle, iconColor: 'text-gray-600 dark:text-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-900' }
              }[ticket.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed'] || { bg: 'bg-blue-50', border: 'border-blue-200', icon: MessageCircle, iconColor: 'text-blue-600', iconBg: 'bg-blue-100' }

              const StatusIcon = statusConfig.icon
              const PriorityIcon = priorityConfig.icon

              return (
                <Card key={ticket._id} className={`cursor-pointer hover:shadow-lg transition-all border-2 ${statusConfig.border} ${statusConfig.bg}`} onClick={() => { setSelectedTicket(ticket); setViewOpen(true) }}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className={`w-12 h-12 flex items-center justify-center ${statusConfig.iconBg} rounded-full`}>
                          <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg">{ticket.subject}</h3>
                            <Badge variant={getStatusColor(ticket.status)} className="text-xs">{ticket.status}</Badge>
                            <Badge className={`text-xs ${priorityConfig.color}`}>
                              <PriorityIcon className="w-3 h-3 mr-1" />
                              {ticket.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{ticket.userId?.name}</span>
                            </div>
                            {ticket.instituteId && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{ticket.instituteId?.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{ticket.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{ticket.userRole || 'User'}</Badge>
                        {ticket.replies && ticket.replies.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageCircle className="w-3 h-3" />
                            <span>{ticket.replies.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {filterTickets(status).length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No {status === 'all' ? '' : status.toLowerCase()} tickets found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-5">
              <div className="flex gap-2 items-center flex-wrap">
                <Badge variant={getStatusColor(selectedTicket.status)} className="text-sm px-3 py-1">{selectedTicket.status}</Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">{selectedTicket.userRole || 'User'}</Badge>
                <Badge className={`text-sm px-3 py-1 ${selectedTicket.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  selectedTicket.priority === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                  {selectedTicket.priority} Priority
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">{selectedTicket.category}</Badge>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Submitted by</p>
                      <p className="text-sm text-muted-foreground">{selectedTicket.userId?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTicket.userId?.email}</p>
                    </div>
                  </div>
                  {selectedTicket.instituteId && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Institute</p>
                        <p className="text-sm text-muted-foreground">{selectedTicket.instituteId?.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="text-sm font-semibold mb-2">Description</p>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Update Status</p>
                <Select value={selectedTicket.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Conversation ({selectedTicket.replies?.length || 0})
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    selectedTicket.replies.map((r: any, i: number) => (
                      <Card key={i} className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                              <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{r.userId?.name || 'User'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>
                  )}
                </div>
              </div>

              {selectedTicket.status !== 'Closed' && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-semibold">Send Reply</p>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="resize-none"
                  />
                  <Button onClick={handleReply} className="w-full gap-2" size="lg">
                    <Send className="w-4 h-4" />
                    Send Reply
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
