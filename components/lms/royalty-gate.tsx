'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export function RoyaltyGate({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [blocked, setBlocked] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const checkAccess = () => {
            // Only run for students
            const userStr = localStorage.getItem('user')
            if (!userStr) return

            const user = JSON.parse(userStr)
            if (user.role !== 'student') {
                setChecking(false)
                return
            }

            // Check course royalty status
            // Note: Login API already enforces this, but this is a secondary client-side check 
            // for users who might already be logged in when status changes.
            if (user.courses && user.courses.length > 0) {
                const hasUnpaidRoyalty = user.courses.some((c: any) => c.status === 'Active' && !c.royaltyPaid)
                if (hasUnpaidRoyalty) {
                    setBlocked(true)
                }
            }
            setChecking(false)
        }

        checkAccess()
    }, [pathname])

    const handleLogout = () => {
        localStorage.clear()
        router.push('/login')
    }

    if (blocked) {
        return (
            <Dialog open={true}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <Lock className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Access Restricted</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Your institute has not completed the necessary fee payments (Royalty) to the Super Admin.
                            <br /><br />
                            You cannot access your panel until this is resolved. Please contact your Institute Administrator immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
                        <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                            Logout & Contact Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    if (checking) return null // Or a loader

    return <>{children}</>
}
