"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Plus, Trash2, Key, Activity, Copy, Check } from "lucide-react"

export function ApiKeysPanel({ serverId }: { serverId: string }) {
    const [keys, setKeys] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        fetchKeys()
    }, [serverId])

    const fetchKeys = async () => {
        try {
            const res = await fetch(`/api/admin/api-keys?serverId=${serverId}`)
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        const res = await fetch("/api/admin/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, serverId })
        })

        if (res.ok) {
            setNewName("")
            setIsCreating(false)
            fetchKeys()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return

        const res = await fetch(`/api/admin/api-keys?id=${id}&serverId=${serverId}`, {
            method: "DELETE"
        })

        if (res.ok) {
            fetchKeys()
        }
    }

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (loading) return <div className="text-zinc-400 p-6">Loading API Keys...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Public API Keys</h2>
                    <p className="text-sm text-zinc-400">Manage API keys for accessing public endpoints programmatically.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Generate Key
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                    <h3 className="mb-4 font-medium text-white">Create New API Key</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Discord Bot Integration"
                            className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                        >
                            Create
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {keys.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-8 text-center">
                        <Key className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
                        <p className="text-zinc-400">No API keys generated yet.</p>
                    </div>
                ) : (
                    keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 p-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-white">{key.name}</h3>
                                    {key.enabled ? (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>
                                    ) : (
                                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">Disabled</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <Activity className="h-3.5 w-3.5" />
                                        {key.usageCount} / {key.dailyLimit} requests today
                                    </div>
                                    <div className="flex items-center gap-1 font-mono">
                                        {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                        <button 
                                            onClick={() => handleCopy(key.key, key.id)}
                                            className="ml-1 hover:text-white transition-colors"
                                            title="Copy full key"
                                        >
                                            {copiedId === key.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(key.id)}
                                className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                title="Revoke Key"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
