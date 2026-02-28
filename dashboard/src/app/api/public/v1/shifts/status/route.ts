import { prisma } from "@/lib/db"
import { validatePublicApiKey, resolveServer, logApiAccess } from "@/lib/public-auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const auth = await validatePublicApiKey()
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })

    const { searchParams } = new URL(req.url)
    const serverName = searchParams.get("server")
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const server = await resolveServer(auth.apiKey)
    if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 })

    const activeShift = await prisma.shift.findFirst({
        where: {
            userId,
            serverId: server.id,
            endTime: null
        }
    })

    await logApiAccess(auth.apiKey, "PUBLIC_SHIFT_STATUS_CHECKED", `User: ${userId}, Server: ${server.name}`)
    return NextResponse.json({
        active: !!activeShift,
        shift: activeShift
    })
}
