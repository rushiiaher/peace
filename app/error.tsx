'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    // Webpack says "Loading chunk"/ChunkLoadError; Turbopack (Next 16 default) says "Failed to load chunk".
    // Happens when a new deployment invalidates the chunks an open tab still references.
    const isChunkError = /ChunkLoadError|Loading chunk|Failed to load chunk/i.test(`${error.name} ${error.message}`)

    useEffect(() => {
        console.error('Unhandled app error:', error)

        // Reload to pick up the new deployment, at most once per 10s so a genuinely missing chunk can't loop.
        const last = Number(sessionStorage.getItem('chunk-reload-at') || 0)
        if (isChunkError && Date.now() - last > 10000) {
            sessionStorage.setItem('chunk-reload-at', String(Date.now()))
            window.location.reload()
        }
    }, [error, isChunkError])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {isChunkError ? 'Updating Application...' : 'Something went wrong!'}
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
                {isChunkError
                    ? 'We have updated the application. Reloading to get the latest version...'
                    : 'An unexpected error has occurred. Our team has been notified.'}
            </p>
            <Button
                onClick={
                    // If it's a chunk error, force a reload. Otherwise try to reset.
                    () => isChunkError ? window.location.reload() : reset()
                }
            >
                {isChunkError ? 'Reload Now' : 'Try again'}
            </Button>
        </div>
    )
}
