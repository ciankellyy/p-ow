import { prisma } from "@/lib/db"
import { Users, Server, FileText, Database } from "lucide-react"

export default async function SuperAdminOverviewPage() {
    // Collect platform telemetry
    const serverCount = await prisma.server.count()
    const memberCount = await prisma.member.count()
    const logCount = await prisma.log.count()

    // Most active servers (based on log volume)
    const topServers = await prisma.server.findMany({
        take: 5,
        orderBy: { logs: { _count: 'desc' } },
        include: { _count: { select: { logs: true, members: true } } }
    })

    const subscriptionStats = await prisma.server.groupBy({
        by: ['subscriptionPlan'],
        _count: { id: true }
    })

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
            <p className="text-zinc-400 mb-8">High-level statistics for the Project Overwatch SaaS platform.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Stat Cards */}
                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-blue-500/10 p-3">
                            <Server className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 font-medium">Total Servers</p>
                            <h2 className="text-2xl font-bold text-white">{serverCount}</h2>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-500/10 p-3">
                            <Users className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 font-medium">Total Members</p>
                            <h2 className="text-2xl font-bold text-white">{memberCount}</h2>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-purple-500/10 p-3">
                            <FileText className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 font-medium">Total Logs</p>
                            <h2 className="text-2xl font-bold text-white">{logCount}</h2>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-amber-500/10 p-3">
                            <Database className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 font-medium">Database Load</p>
                            <h2 className="text-lg font-bold text-emerald-500">Healthy</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Servers Table */}
                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Most Active Servers</h3>
                    <div className="space-y-4">
                        {topServers.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5">
                                <div>
                                    <p className="font-semibold text-white">{s.customName || s.name}</p>
                                    <p className="text-xs text-zinc-500">{s.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white">{s._count.logs} Logs</p>
                                    <p className="text-xs text-zinc-400">{s._count.members} Members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscriptions Overview */}
                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Subscription Distribution</h3>
                    <div className="space-y-4">
                        {subscriptionStats.map(s => (
                            <div key={s.subscriptionPlan} className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${s.subscriptionPlan === 'pow-max' ? 'bg-amber-500' : s.subscriptionPlan === 'pow-pro' ? 'bg-indigo-500' : 'bg-zinc-500'}`}></div>
                                    <p className="font-semibold text-white capitalize">{s.subscriptionPlan || "free"}</p>
                                </div>
                                <p className="text-lg font-bold text-white">{s._count.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}
