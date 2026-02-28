import { getSession } from "@/lib/auth-clerk"
import { redirect } from "next/navigation"
import { ServerCreationWizard } from "@/components/admin/server-creation-wizard"
import { Shield } from "lucide-react"

export default async function CreateServerPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    return (
        <div className="min-h-screen bg-[#111] font-sans text-zinc-100 flex flex-col items-center pt-24 pb-12 px-4">
            <div className="mb-8 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
                    <Shield className="h-8 w-8 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white">Create a New Server</h1>
                <p className="text-zinc-400 max-w-lg mx-auto text-lg hover:text-zinc-300 transition-colors">
                    Deploy Project Overwatch to your community. Follow the steps to link your PRC server and Discord Guild.
                </p>
            </div>

            <div className="w-full max-w-2xl bg-[#151515] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-10">
                <ServerCreationWizard />
            </div>
        </div>
    )
}
