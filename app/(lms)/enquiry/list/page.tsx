'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { Mail, Phone, Calendar, User } from 'lucide-react'

export default function EnquiryList() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [instituteId, setInstituteId] = useState<string | null>(null)
  const [handlers, setHandlers] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.instituteId) {
      setInstituteId(user.instituteId)
    }
  }, [])

  useEffect(() => {
    if (instituteId) {
      fetchEnquiries()
    }
  }, [instituteId])

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`/api/enquiries?instituteId=${instituteId}`)
      const data = await res.json()
      setEnquiries(data)
      await fetchHandlers(data)
    } catch (error) {
      toast.error('Failed to fetch enquiries')
    } finally {
      setLoading(false)
    }
  }

  const fetchHandlers = async (enquiries: any[]) => {
    const handlerMap = new Map()
    
    for (const enquiry of enquiries) {
      if (enquiry.handledBy && enquiry.handledByModel) {
        const key = `${enquiry.handledBy}-${enquiry.handledByModel}`
        if (!handlerMap.has(key)) {
          try {
            const endpoint = enquiry.handledByModel === 'User' ? '/api/users' : '/api/staff'
            const res = await fetch(`${endpoint}/${enquiry.handledBy}`)
            if (res.ok) {
              const data = await res.json()
              handlerMap.set(key, data)
            }
          } catch (error) {
            console.error('Failed to fetch handler')
          }
        }
      }
    }
    
    setHandlers(handlerMap)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return
    
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Enquiry deleted successfully')
        fetchEnquiries()
      } else {
        toast.error('Failed to delete enquiry')
      }
    } catch (error) {
      toast.error('Failed to delete enquiry')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Contacted': return 'bg-yellow-100 text-yellow-800'
      case 'Converted': return 'bg-green-100 text-green-800'
      case 'Lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <section className="space-y-6">
      <SectionHeader title="Enquiry List" subtitle="View, filter, and manage all enquiries." />
      
      <div className="space-y-3">
        {enquiries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No enquiries found
            </CardContent>
          </Card>
        ) : (
          enquiries.map((enquiry) => {
            const handlerKey = enquiry.handledBy && enquiry.handledByModel 
              ? `${enquiry.handledBy}-${enquiry.handledByModel}` 
              : null
            const handler = handlerKey ? handlers.get(handlerKey) : null
            
            return (
              <Card key={enquiry._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{enquiry.name}</h3>
                        <Badge className={getStatusColor(enquiry.status)}>{enquiry.status}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{enquiry.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{enquiry.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Course:</span>
                          <span>{enquiry.courseInterested}</span>
                        </div>
                        {handler && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{handler.name} ({enquiry.handledByModel === 'User' ? 'Admin' : handler.role})</span>
                          </div>
                        )}
                        {enquiry.followUpDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Follow-up: {new Date(enquiry.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {enquiry.source && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Source:</span>
                            <span>{enquiry.source}</span>
                          </div>
                        )}
                      </div>
                      
                      {enquiry.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Notes:</span> {enquiry.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(enquiry._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </section>
  )
}
