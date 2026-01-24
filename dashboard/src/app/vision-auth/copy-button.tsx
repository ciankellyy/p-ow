"use client"

import { useState } from "react"

export function CopyButton({ token }: { token: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error("Failed to copy:", e)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
        >
            {copied ? "✓ Copied!" : "Copy Token"}
        </button>
    )
}
