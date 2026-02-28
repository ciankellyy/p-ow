import { getSession } from "@/lib/auth-clerk"
import { NextResponse } from "next/server"
import { PrcClient } from "@/lib/prc"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    const session = await getSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { prcApiKey, discordGuildId } = await req.json()

        if (!prcApiKey || !discordGuildId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Verify PRC again
        let serverName = ""
        try {
            const prcClient = new PrcClient(prcApiKey)
            const serverInfo = await prcClient.getServer()
            serverName = serverInfo.Name
        } catch (e) {
            return NextResponse.json({ error: "API Key validation failed during creation." }, { status: 400 })
        }

        // 2. Verify Discord again
        const botToken = process.env.DISCORD_BOT_TOKEN
        let guildName = ""
        try {
            const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discordGuildId}`, {
                headers: { Authorization: `Bot ${botToken}` }
            })

            if (!guildRes.ok) {
                return NextResponse.json({ error: "Discord verification failed during creation." }, { status: 400 })
            }
            guildName = (await guildRes.json()).name
        } catch (e) {
            return NextResponse.json({ error: "Discord API error." }, { status: 500 })
        }

        // 3. Create Server & Member Transaction
        // We use a transaction to ensure both or neither are created
        const result = await prisma.$transaction(async (tx: any) => {
            const newServer = await tx.server.create({
                data: {
                    name: serverName,
                    customName: `${guildName} Backend`,
                    apiUrl: prcApiKey,
                    discordGuildId: discordGuildId,
                    subscriptionPlan: "free", // Default to free tier
                }
            })

            await tx.member.create({
                data: {
                    userId: session.user.id,
                    serverId: newServer.id,
                    discordId: session.user.discordId,
                    robloxId: session.user.robloxId,
                    isAdmin: true // Creator is always admin
                }
            })

            return newServer
        })

        return NextResponse.json({ success: true, serverId: result.id })

    } catch (e: any) {
        console.error("Server Creation Error:", e)
        return NextResponse.json({ error: "Failed to create server. It might already exist." }, { status: 500 })
    }
}
