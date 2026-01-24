import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-clerk"
import { SignJWT } from "jose"
import { CopyButton } from "./copy-button"

const VISION_SECRET = new TextEncoder().encode(
    process.env.VISION_JWT_SECRET || "REMOVED_VISION_JWT_SECRET"
)

export default async function VisionAuthPage() {
    const session = await getSession()

    if (!session?.user) {
        redirect("/login?redirect=/vision-auth")
    }

    // Generate the token
    const token = await new SignJWT({
        userId: session.user.id,
        username: session.user.username,
        robloxId: session.user.robloxId,
        robloxUsername: session.user.robloxUsername,
        discordId: session.user.discordId
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .setIssuer("pow-dashboard")
        .setAudience("pow-vision")
        .sign(VISION_SECRET)

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl font-bold">P</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold mb-2">POW Vision Token</h1>
                    <p className="text-white/50 text-sm">
                        Copy this token and paste it into POW Vision to log in.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">
                        Your Token
                    </label>
                    <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-4">
                        <code className="text-indigo-400 text-xs break-all select-all">
                            {token}
                        </code>
                    </div>
                    <p className="text-white/30 text-xs mt-2">
                        This token expires in 7 days. Keep it secret!
                    </p>
                </div>

                <div className="space-y-3">
                    <CopyButton token={token} />
                    <a
                        href="/dashboard"
                        className="block w-full text-center py-3 rounded-lg bg-[#1e1e2e] hover:bg-[#2a2a3a] text-white/60 text-sm transition-colors"
                    >
                        Back to Dashboard
                    </a>
                </div>

                <div className="mt-6 pt-6 border-t border-[#1e1e2e]">
                    <p className="text-white/30 text-xs text-center">
                        Logged in as <span className="text-white/50">{session.user.username}</span>
                        {session.user.robloxUsername && (
                            <> • Roblox: <span className="text-white/50">{session.user.robloxUsername}</span></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}
