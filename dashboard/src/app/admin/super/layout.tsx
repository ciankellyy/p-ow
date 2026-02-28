import { getSession } from "@/lib/auth-clerk"
import { redirect } from "next/navigation"
import { isSuperAdmin } from "@/lib/admin"
import { Shield, LayoutDashboard, Database, Settings } from "lucide-react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default async function SuperAdminLayout({
    children
}: {
    children: React.ReactNode
}) {
    const session = await getSession()
    if (!session || !isSuperAdmin(session.user as any)) {
        redirect("/dashboard")
    }

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
            {/* Superadmin Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#111] p-4 flex flex-col">
                <div className="mb-8 flex items-center gap-3 px-2">
                    <Shield className="h-8 w-8 text-sky-500" />
                    <div className="font-bold text-white tracking-tight">System Admin</div>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link href="/admin/super" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                        Platform Overview
                    </Link>
                    <Link href="/admin/super/servers" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Database className="h-4 w-4" />
                        Server Management
                    </Link>
                    <Link href="/admin/super/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Settings className="h-4 w-4" />
                        Global Config
                    </Link>
                </nav>

                <div className="mt-auto border-t border-white/5 bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Superuser</span>
                        <span className="text-[10px] text-zinc-500">All Access Granted</span>
                    </div>
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
