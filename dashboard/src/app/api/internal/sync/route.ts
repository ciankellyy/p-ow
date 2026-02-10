import { prisma } from "@/lib/db"
import { fetchAndSaveLogs } from "@/lib/log-syncer"
import { NextResponse } from "next/server"

const INTERNAL_SECRET = process.env.INTERNAL_SYNC_SECRET!

export async function POST(req: Request) {
    const authHeader = req.headers.get("x-internal-secret")

    if (authHeader !== INTERNAL_SECRET) {
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

            const res = await fetchAndSaveLogs(server.apiUrl, server.id)

            // Tick automations (time-based)
            const { AutomationEngine } = await import("@/lib/automation-engine")
            await AutomationEngine.tick(server.id)

            return { serverId: server.id, newLogs: res.newLogsCount }
        })

        const data = await Promise.all(promises)

        return NextResponse.json({ success: true, results: data })
    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 })
    }
}
