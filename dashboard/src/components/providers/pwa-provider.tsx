"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PWAContextType {
    isSupported: boolean
    isInstalled: boolean // true if standalone
    isMobile: boolean
    isIOS: boolean
    canInstall: boolean // true if prompt is available
    install: () => Promise<void>
}

const PWAContext = createContext<PWAContextType | null>(null)

export function usePWA() {
    const context = useContext(PWAContext)
    if (!context) {
        throw new Error("usePWA must be used within a PWAProvider")
    }
    return context
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [isSupported, setIsSupported] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        setIsSupported(true)

        // Check if mobile
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        setIsMobile(mobile)
        
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
        setIsIOS(ios)

        // Check standalone
        const checkStandalone = () => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes("android-app://")
            setIsInstalled(isStandalone)
        }
        
        checkStandalone()
        window.matchMedia("(display-mode: standalone)").addEventListener("change", checkStandalone)

        // Capture install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Check mobile again here to be safe inside the closure if needed, 
            // though the effect dependency is empty so we rely on the initial check.
            // Better to re-check UA or use the state if possible, but state inside listener might be stale.
            // Let's use a fresh UA check to be safe.
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

            if (isMobileUA) {
                // Prevent default to suppress browser mini-infobar on mobile so we can show our Gate
                e.preventDefault()
                setDeferredPrompt(e)
            } else {
                // On desktop, let the browser show its native install UI (omnibox icon)
                // We still capture the event if we wanted to trigger it manually, but we won't preventDefault
                setDeferredPrompt(e) 
            }
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
        }
    }, [])

    const install = async () => {
        if (!deferredPrompt) {
            return
        }

        try {
            await deferredPrompt.prompt()
            
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === "accepted") {
                setDeferredPrompt(null)
            }
        } catch (error) {
            // Silently fail
        }
    }

    return (
        <PWAContext.Provider value={{
            isSupported,
            isInstalled,
            isMobile,
            isIOS,
            canInstall: !!deferredPrompt,
            install
        }}>
            {children}
        </PWAContext.Provider>
    )
}
