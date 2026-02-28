import { prisma } from "@/lib/db"
import { fetchAndSaveLogs } from "@/lib/log-syncer"
import { trackSyncCycle } from "@/lib/metrics"
import { NextResponse } from "next/server"

const INTERNAL_SECRET = process.env.INTERNAL_SYNC_SECRET!

export async function POST(req: Request) {
    if (!INTERNAL_SECRET) {
        console.error("[SECURITY] INTERNAL_SYNC_SECRET is not set. Sync disabled.")
        return new NextResponse("Server Configuration Error", { status: 500 })
    }

    const authHeader = req.headers.get("x-internal-secret")

    if (!authHeader || authHeader !== INTERNAL_SECRET) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json().catch(() => ({}))
        const { serverId } = body

        let servers = []

        if (serverId) {
            const s = await prisma.server.findUnique({ where: { id: serverId } })
            if (s) servers.push(s)
        } else {
            servers = await prisma.server.findMany({
                where: {
                    apiUrl: { not: "" }
                }
            })
        }

        const promises = servers.map(async (server: any) => {
            if (!server.apiUrl) return

            const syncStart = Date.now()
            try {
                const res = await fetchAndSaveLogs(server.apiUrl, server.id)

                // Tick automations (time-based)
                const { AutomationEngine } = await import("@/lib/automation-engine")
                await AutomationEngine.tick(server.id)

                trackSyncCycle(server.id, Date.now() - syncStart, res.newLogsCount, "ok")
                return { serverId: server.id, newLogs: res.newLogsCount }
            } catch (e: any) {
                trackSyncCycle(server.id, Date.now() - syncStart, 0, "error", e.message)
                throw e
            }
        })

        const data = await Promise.all(promises)

        return NextResponse.json({ success: true, results: data })
    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 })
    }
}

