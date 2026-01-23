"use client"

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export function WarningBanner() {
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        const updateState = () => {
            // @ts-ignore
            const ph = window.posthog
            if (!ph) return

            const enabled = ph.isFeatureEnabled('warning-banner')
            const payload = ph.getFeatureFlagPayload('warning-banner')

            if (enabled && payload) {
                const msg = typeof payload === 'string' 
                    ? payload 
                    : (payload as any)?.message || JSON.stringify(payload)
                setMessage(msg)
            } else {
                setMessage(null)
            }
        }

        const onReady = () => {
            updateState()
            // @ts-ignore
            if (window.posthog) {
                // @ts-ignore
                window.posthog.onFeatureFlags(updateState)
            }
        }

        // Check if already ready
        // @ts-ignore
        if (window.posthog) {
            onReady()
        }

        window.addEventListener('posthog-ready', onReady)

        return () => {
            window.removeEventListener('posthog-ready', onReady)
        }
    }, [])

    if (!message) return null

    return (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-500">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>{message}</span>
            </div>
        </div>
    )
}