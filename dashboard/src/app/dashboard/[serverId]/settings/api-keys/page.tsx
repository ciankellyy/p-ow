import { getSession } from "@/lib/auth-clerk"
import { redirect } from "next/navigation"
import { isServerAdmin } from "@/lib/admin"
import { ApiKeysPanel } from "@/components/admin/api-keys-panel"

export default async function ApiKeysPage({
    params,
}: {
    params: Promise<{ serverId: string }>
}) {
    const session = await getSession()
    if (!session) redirect("/login")

    const { serverId } = await params

    if (!await isServerAdmin(session.user as any, serverId)) {
        redirect(`/dashboard/${serverId}`)
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-white">API Keys</h1>
                <p className="text-zinc-400">Generate and manage API keys for external integrations.</p>
            </div>

            <ApiKeysPanel serverId={serverId} />
        </div>
    )
}
