import { prisma } from "@/lib/db"
import { SuperConfigForm } from "@/components/admin/super-config-form"

export default async function SuperSettingsPage() {
    const configs = await prisma.config.findMany({
        orderBy: { key: 'asc' }
    })

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Global Configuration</h1>
            <p className="text-zinc-400 mb-8">Manage system-wide backend settings and feature toggles.</p>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Add or Edit Config</h3>
                    <SuperConfigForm />
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#151515] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Active Configurations</h3>
                    <div className="space-y-3">
                        {configs.map(config => (
                            <div key={config.key} className="p-4 rounded-xl border border-white/5 bg-[#111] flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-mono text-sm text-emerald-400 font-semibold">{config.key}</p>
                                    <p className="text-sm text-zinc-300 break-all">{config.value}</p>
                                </div>
                                <div className="text-xs text-zinc-500 shrink-0 ml-4 border border-zinc-800 rounded px-2 py-1">
                                    SysAdmin Level
                                </div>
                            </div>
                        ))}
                        {configs.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-4">No global configurations found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
