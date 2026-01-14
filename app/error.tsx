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
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled app error:', error)

        // Automatically reload the page if a ChunkLoadError occurs
        // This usually happens when a new deployment invalidates cached chunks
        if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
            window.location.reload()
        }
    }, [error])

    const isChunkError = error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')

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
