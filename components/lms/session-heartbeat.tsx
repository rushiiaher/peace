'use client'

import { useEffect } from 'react'

export function SessionHeartbeat() {
    useEffect(() => {
        const ping = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return

                await fetch('/api/auth/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            } catch (e) {
                // ignore errors
            }
        }

        // Ping every 1 minute
        const interval = setInterval(ping, 60 * 1000)

        // Initial ping
        ping()

        return () => clearInterval(interval)
    }, [])

    return null
}
