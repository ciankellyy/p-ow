import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-clerk"
import { getServerPlan } from "@/lib/subscription"
import { isServerMember } from "@/lib/admin"

// Get server subscription plan and limits
export async function GET(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { serverId } = await params
        
        if (!await isServerMember(session.user as any, serverId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const planInfo = await getServerPlan(serverId)

        return NextResponse.json(planInfo)
    } catch (error) {
        console.error("[Server Plan] Error:", error)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
