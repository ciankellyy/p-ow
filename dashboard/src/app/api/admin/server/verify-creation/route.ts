import { getSession } from "@/lib/auth-clerk"
import { NextResponse } from "next/server"
import { PrcClient } from "@/lib/prc"

export async function POST(req: Request) {
    const session = await getSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { prcApiKey, discordGuildId } = await req.json()

        if (!prcApiKey || !discordGuildId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Verify PRC API Key
        let prcValid = false
        let serverName = ""
        try {
            const prcClient = new PrcClient(prcApiKey)
            const serverInfo = await prcClient.getServer()
            prcValid = true
            serverName = serverInfo.Name
        } catch (e) {
            return NextResponse.json({ error: "Invalid PRC API Key or server is offline." }, { status: 400 })
        }

        // 2. Verify Discord Bot Presence
        let botInGuild = false
        let guildName = ""
        const botToken = process.env.DISCORD_BOT_TOKEN

        if (!botToken) {
            return NextResponse.json({ error: "System Configuration Error: Missing Bot Token" }, { status: 500 })
        }

        try {
            const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discordGuildId}`, {
                headers: { Authorization: `Bot ${botToken}` }
            })

            if (guildRes.ok) {
                const guildData = await guildRes.json()
                botInGuild = true
                guildName = guildData.name
            } else {
                return NextResponse.json({ error: "The POW Discord Bot is not present in that Guild." }, { status: 400 })
            }
        } catch (e) {
            return NextResponse.json({ error: "Failed to verify Discord Guild." }, { status: 500 })
        }

        return NextResponse.json({
            prcValid,
            serverName,
            botInGuild,
            guildName
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
