'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabsProfessional } from "@/components/lms/animated-tabs"
import { toast } from "sonner"
import { UserPlus, Mail, Phone, BookOpen, Calendar, Plus, Edit, Trash2, Clock, GraduationCap } from "lucide-react"
import Loader from "@/components/ui/loader"
import Link from 'next/link'

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const instituteId = user.instituteId?._id || user.instituteId
      const res = await fetch(`/api/enquiries?instituteId=${instituteId}`)
      const data = await res.json()
      setEnquiries(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to fetch enquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // prevent navigation if inside link
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Enquiry deleted successfully')
        fetchEnquiries()
      }
    } catch (error) {
      toast.error('Failed to delete enquiry')
    }
  }

  const filterByStatus = (status: string) => enquiries.filter((e: any) => e.status === status)

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  const totalEnquiries = enquiries.length
  const newEnquiries = filterByStatus('New').length
  const contactedEnquiries = filterByStatus('Contacted').length
  const convertedEnquiries = filterByStatus('Converted').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Enquiry Management" subtitle="Manage student enquiries" />
        <Button asChild className="gap-2">
          <Link href="/institute-admin/enquiries/add">
            <Plus className="w-4 h-4" />Add Enquiry
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enquiries</p>
                <p className="text-2xl font-bold text-blue-950 dark:text-blue-100">{totalEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-100 dark:border-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl shadow-sm">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New / Pending</p>
                <p className="text-2xl font-bold text-orange-950 dark:text-orange-100">{newEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-950 dark:text-purple-100">{contactedEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl shadow-sm">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-green-950 dark:text-green-100">{convertedEnquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-6">
        <AnimatedTabsProfessional
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "all", label: "All Enquiries", count: totalEnquiries },
            { id: "New", label: "New", count: newEnquiries },
            { id: "Contacted", label: "Contacted", count: contactedEnquiries },
            { id: "Converted", label: "Converted", count: convertedEnquiries },
            { id: "Lost", label: "Lost", count: filterByStatus('Lost').length },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(activeTab === 'all' ? enquiries : filterByStatus(activeTab)).map((enq: any) => {
          // Helper to get status color
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'New': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
              case 'Contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
              case 'Converted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
              case 'Lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
              default: return 'bg-gray-100 text-gray-700';
            }
          }

          return (
            <Card key={enq._id} className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group overflow-hidden border-muted/60">
              <div className={`h-1.5 w-full ${enq.status === 'Converted' ? 'bg-green-500' : enq.status === 'Lost' ? 'bg-red-500' : enq.status === 'Contacted' ? 'bg-purple-500' : 'bg-orange-500'}`} />
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{enq.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" /> {enq.phone}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(enq.status)} border shadow-sm`}>
                    {enq.status}
                  </Badge>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2.5 text-sm p-2 rounded-md bg-muted/40">
                    <div className="p-1.5 bg-background rounded-md shadow-sm">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-medium truncate">{enq.courseInterested}</span>
                  </div>

                  {enq.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{enq.email}</span>
                    </div>
                  )}

                  {enq.followUpDate && (
                    <div className="flex items-center gap-2 text-sm px-1 text-orange-600 dark:text-orange-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Follow up: {new Date(enq.followUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 mt-1 flex items-center gap-2 border-t border-dashed">
                  <Button
                    asChild
                    className="flex-1 h-8 text-xs font-medium"
                    variant="outline"
                  >
                    <Link href={`/institute-admin/enquiries/${enq._id}/edit`}>
                      Edit Details
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={(e) => handleDelete(enq._id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {enq.status !== 'Converted' && (
                  <Button
                    asChild
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-2 h-9"
                    size="sm"
                  >
                    <Link href={`/institute-admin/enquiries/${enq._id}/convert`}>
                      <GraduationCap className="w-4 h-4" />
                      Convert to Admission
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
        {/* Empty state */}
        {(activeTab === 'all' ? enquiries : filterByStatus(activeTab)).length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No enquiries found in {activeTab === 'all' ? 'total' : activeTab}</p>
          </div>
        )}
      </div>

    </div >
  )
}
