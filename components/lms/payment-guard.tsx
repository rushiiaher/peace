'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PaymentGuard({ children }: { children: React.ReactNode }) {
    const [isActive, setIsActive] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                setLoading(false)
                return
            }

            const user = JSON.parse(userStr)
            if (user.role !== 'institute-admin' || !user.instituteId) {
                setLoading(false)
                return
            }

            // Fetch institute details to check status
            const instituteId = typeof user.instituteId === 'string' ? user.instituteId : user.instituteId._id
            const res = await fetch(`/api/institutes/${instituteId}`)
            if (res.ok) {
                const data = await res.json()
                setIsActive(data.status === 'Active')
            }
        } catch (error) {
            console.error('Failed to check institute status:', error)
        } finally {
            setLoading(false)
        }
    }

    // Allow access to payments page regardless of status
    const isPaymentPage = pathname === '/institute-admin/payments'

    if (loading) return <>{children}</>

    // If status is specifically false (Inactive) and not on payment page, block access
    if (isActive === false && !isPaymentPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
                <Card className="w-full max-w-md border-red-200 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Account Deactivated</CardTitle>
                        <CardDescription className="text-base pt-2">
                            Your institute account has been temporarily deactivated due to pending dues.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="bg-red-50 p-3 rounded-lg flex items-start gap-3 text-sm text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                Access to the dashboard and other features is restricted. Please clear your pending dues to restore full access immediately.
                            </p>
                        </div>
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700"
                            size="lg"
                            onClick={() => router.push('/institute-admin/payments')}
                        >
                            Pay to Super Admin
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <>{children}</>
}
