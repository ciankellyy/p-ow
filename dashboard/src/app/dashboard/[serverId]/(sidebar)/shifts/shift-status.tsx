"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { ShiftButton } from "./button"

interface ShiftStatusProps {
    serverId: string
    initialActive: boolean
    initialStartTime?: string
    disabled?: boolean
}

export function ShiftStatus({ serverId, initialActive, initialStartTime, disabled }: ShiftStatusProps) {
    const [isActive, setIsActive] = useState(initialActive)
    const [startTime, setStartTime] = useState<Date | null>(initialStartTime ? new Date(initialStartTime) : null)
    const [elapsed, setElapsed] = useState("")

    // Optimization 5: Intelligent Polling with Visibility Check
    useEffect(() => {
        const checkStatus = async () => {
            // Only poll if tab is active
            if (document.visibilityState !== 'visible') return

            try {
                const res = await fetch(`/api/shifts/status?serverId=${serverId}`)
                if (res.ok) {
                    const data = await res.json()
                    setIsActive(data.active)
                    setStartTime(data.shift?.startTime ? new Date(data.shift.startTime) : null)
                }
            } catch (e) {}
        }

        // Poll every 10 seconds instead of 1 second
        const pollInterval = setInterval(checkStatus, 10000)
        
        // Also check on focus
        window.addEventListener('focus', checkStatus)
        
        return () => {
            clearInterval(pollInterval)
            window.removeEventListener('focus', checkStatus)
        }
    }, [serverId])

    // Update elapsed time every second when active
    useEffect(() => {
        if (!isActive || !startTime) {
            setElapsed("")
            return
        }

        const updateElapsed = () => {
            const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const h = Math.floor(duration / 3600)
            const m = Math.floor((duration % 3600) / 60)
            const s = duration % 60
            setElapsed(`${h}h ${m}m ${s}s`)
        }

        updateElapsed()
        const interval = setInterval(updateElapsed, 1000)
        return () => clearInterval(interval)
    }, [isActive, startTime])

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 ${isActive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                <Clock className="h-10 w-10" />
            </div>

            <div className="text-center">
                <p className="text-lg font-medium text-white">
                    {isActive ? "On Duty" : "Off Duty"}
                </p>
                {isActive && startTime && (
                    <>
                        <p className="text-sm text-emerald-400">
                            Started: {startTime.toLocaleTimeString()}
                        </p>
                        <p className="text-xl font-bold text-emerald-300 mt-2">
                            {elapsed}
                        </p>
                    </>
                )}
            </div>

            <ShiftButton isActive={isActive} serverId={serverId} disabled={disabled} />
        </div>
    )
}
