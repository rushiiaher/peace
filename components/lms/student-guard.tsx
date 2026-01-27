'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function StudentGuard({ children }: { children: React.ReactNode }) {
    const [isActive, setIsActive] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                setLoading(false)
                setIsActive(null) // Allow access if no user data (handled by auth guard)
                return
            }

            let user
            try {
                user = JSON.parse(userStr)
            } catch (parseError) {
                console.error('Failed to parse user data:', parseError)
                localStorage.removeItem('user') // Clear corrupted data
                setLoading(false)
                setIsActive(null)
                return
            }

            if (user.role !== 'student') {
                setLoading(false)
                setIsActive(null) // Allow access (role guard will handle)
                return
            }

            // Fetch user details to check status
            const userId = user.id || user._id

            if (!userId) {
                console.error('No user ID found in localStorage')
                setLoading(false)
                setIsActive(null) // Allow access with warning logged
                return
            }

            try {
                const res = await fetch(`/api/students?userId=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data && typeof data.status === 'string') {
                        setIsActive(data.status === 'Active')
                    } else {
                        // If no status field, assume active
                        console.warn('Student data missing status field, assuming active')
                        setIsActive(true)
                    }
                } else if (res.status === 404) {
                    console.error('Student not found in database')
                    // Allow access but log the issue
                    setIsActive(true)
                } else {
                    console.error('Failed to fetch student status:', res.status)
                    // On API error, allow access (fail open)
                    setIsActive(true)
                }
            } catch (fetchError) {
                console.error('Network error checking student status:', fetchError)
                // On network error, allow access (fail open)
                setIsActive(true)
            }
        } catch (error) {
            console.error('Unexpected error in student guard:', error)
            // On any unexpected error, allow access but log it
            setIsActive(true)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <>{children}</>

    // If status is specifically false (Inactive), block access strictly
    if (isActive === false) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
                <Card className="w-full max-w-md border-red-200 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Account Deactivated</CardTitle>
                        <CardDescription className="text-base pt-2">
                            Your account has been temporarily deactivated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 text-sm text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                You have been restricted from accessing the Learning Management System.
                                Please contact your Institute Administrator immediately to resolve any pending issues.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <>{children}</>
}
