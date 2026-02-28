"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export function SuperServersTable({ initialServers }: { initialServers: any[] }) {
    const [servers, setServers] = useState(initialServers)
    const [search, setSearch] = useState("")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const router = useRouter()

    const filteredServers = servers.filter(s =>
        (s.customName || "").toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    )

    const handleSubscriptionChange = async (serverId: string, newPlan: string) => {
        setUpdatingId(serverId)
        try {
            const res = await fetch("/api/admin/super/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serverId, plan: newPlan })
            })

            if (res.ok) {
                setServers(servers.map(s =>
                    s.id === serverId ? { ...s, subscriptionPlan: newPlan } : s
                ))
                router.refresh()
            } else {
                alert("Failed to update subscription.")
            }
        } catch (e) {
            alert("An error occurred.")
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#111]">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or ID..."
                        className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-[#111] text-xs uppercase text-zinc-500 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 font-medium">Server Name / ID</th>
                            <th className="px-6 py-4 font-medium">Guild ID</th>
                            <th className="px-6 py-4 font-medium">Members</th>
                            <th className="px-6 py-4 font-medium">Logs</th>
                            <th className="px-6 py-4 font-medium">Subscription</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredServers.map((server) => (
                            <tr key={server.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-white">{server.customName || server.name}</div>
                                    <div className="text-xs font-mono text-zinc-600 mt-0.5">{server.id}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{server.discordGuildId || "N/A"}</td>
                                <td className="px-6 py-4">{server._count.members}</td>
                                <td className="px-6 py-4">{server._count.logs}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${server.subscriptionPlan === 'pow-max' ? 'bg-amber-500' :
                                                server.subscriptionPlan === 'pow-pro' ? 'bg-indigo-500' :
                                                    'bg-zinc-500'
                                            }`} />
                                        <span className="capitalize text-zinc-300 font-medium">
                                            {server.subscriptionPlan || "free"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {updatingId === server.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400 inline-block" />
                                    ) : (
                                        <select
                                            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-2 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                                            value={server.subscriptionPlan || "free"}
                                            onChange={(e) => handleSubscriptionChange(server.id, e.target.value)}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pow-pro">POW Pro</option>
                                            <option value="pow-max">POW Max</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredServers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                    No servers found matching "{search}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
