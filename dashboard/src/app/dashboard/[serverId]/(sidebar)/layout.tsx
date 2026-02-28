
import { Sidebar } from "@/components/layout/sidebar"
import { getSession } from "@/lib/auth-clerk"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { isSuperAdmin } from "@/lib/admin"
import { ClerkProvider, UserButton } from "@clerk/nextjs"
import { DiscordRoleSyncProvider } from "@/components/providers/discord-role-sync-provider"
import { BottomNav } from "@/components/pwa/BottomNav"
import { UpsellBanner } from "@/components/subscription/upsell-banner"

export default async function ServerDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ serverId: string }>
}) {
    const session = await getSession()

    if (!session) {
        redirect("/login")
        return null
    }

    const { serverId } = await params

    const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { subscriptionPlan: true }
    })

    // Enforce Tenant Isolation (User must be a member of this server or a Superadmin)
    if (!isSuperAdmin(session.user as any)) {
        // Broaden check to any possible ID the user might be registered with
        const possibleIds = [
            session.user.id,
            session.user.discordId,
            session.user.robloxId
        ].filter(Boolean) as string[]

        const isMember = await prisma.member.findFirst({
            where: {
                serverId: serverId,
                OR: [
                    { userId: { in: possibleIds } },
                    { discordId: session.user.discordId }
                ]
            }
        })

        if (!isMember) {
            redirect("/dashboard")
        }
    }

    // Enforce Discord AND Roblox Connection
    const missingDiscord = !session.user.discordId
    const missingRoblox = !session.user.robloxId

    if (missingDiscord || missingRoblox) {
        const missingConnections = []
        if (missingDiscord) missingConnections.push("Discord")
        if (missingRoblox) missingConnections.push("Roblox")

        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-4 text-white">
                <h1 className="mb-4 text-2xl font-bold">Account Connection Required</h1>
                <p className="mb-8 text-zinc-400">Please connect your <strong>{missingConnections.join(" and ")}</strong> account{missingConnections.length > 1 ? "s" : ""} in User Settings to continue.</p>
                {/* Clerk's UserProfile component could be opened here, or just a UserButton to let them manage account */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                    <p className="mb-4 text-sm text-zinc-300">Click your profile below → Manage Account → Social Connections</p>
                    <UserButton afterSignOutUrl="/login" />
                </div>
            </div>
        )
    }


    return (
        <DiscordRoleSyncProvider serverId={serverId}>
            <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
                {/* Sidebar - hidden on mobile */}
                <div className="hidden md:block">
                    <Sidebar serverId={serverId} />
                </div>
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Topbar */}
                    <header className="flex h-16 items-center border-b border-white/5 bg-zinc-900/50 px-6 backdrop-blur-xl">
                        <h2 className="text-lg font-medium text-white">Dashboard Overview</h2>
                        <div className="ml-auto flex items-center gap-4">
                            <UserButton afterSignOutUrl="/login" />
                        </div>
                    </header>

                    {/* Main content with bottom padding on mobile for nav */}
                    <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        <UpsellBanner 
                            serverId={serverId} 
                            plan={server?.subscriptionPlan || 'free'} 
                            feature="PRO_OVERVIEW"
                            title="Supercharge your Server"
                            description="Upgrade to Pro for Raid Detection, 5000 daily API requests, and 100 AI summaries. Go Max for Unlimited everything, White Label Bot, and Vision Access."
                            storageKey="general_pro"
                        />
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="hidden md:block py-3 px-6 border-t border-white/5 text-center">
                        <p className="text-xs text-zinc-600">© 2026 Project Overwatch - erlc moderation but better™</p>
                    </footer>
                </div>

                {/* Mobile bottom navigation */}
                <BottomNav serverId={serverId} />
            </div>
        </DiscordRoleSyncProvider>
    )
}
