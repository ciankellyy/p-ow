import { clerkClient } from "@clerk/nextjs/server"
import { getSession } from "@/lib/auth-clerk"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const clerk = await clerkClient()
        const tokens = await clerk.users.getUserOauthAccessToken(session.user.id, "oauth_discord")
        const discordToken = tokens.data[0]?.token

        if (!discordToken) {
            return NextResponse.json({ error: "No Discord connection" }, { status: 400 })
        }

        // Get User Guilds
        const userGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
            headers: { Authorization: `Bearer ${discordToken}` }
        })

        if (!userGuildsRes.ok) return NextResponse.json({ error: "Failed to fetch user guilds" }, { status: 500 })
        const userGuilds = await userGuildsRes.json()

        // Filter to guilds where user is Admin (permission bit 8 is ADMINISTRATOR, bit 32 is MANAGE_GUILD)
        // permissions & 0x8 or permissions & 0x20
        const adminGuilds = userGuilds.filter((g: any) => {
            const perms = BigInt(g.permissions)
            return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20)
        })

        if (adminGuilds.length === 0) {
            return NextResponse.json([])
        }

        // Get Bot Guilds
        const botToken = process.env.DISCORD_BOT_TOKEN
        const botGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
            headers: { Authorization: `Bot ${botToken}` }
        })
        const botGuilds = botGuildsRes.ok ? await botGuildsRes.json() : []
        const botGuildIds = new Set(botGuilds.map((g: any) => g.id))

        // Get Existing POW Servers linked to these guilds
        const adminGuildIds = adminGuilds.map((g: any) => g.id)
        const existingServers = await prisma.server.findMany({
            where: { discordGuildId: { in: adminGuildIds } },
            select: { discordGuildId: true }
        })
        const existingGuildIds = new Set(existingServers.map(s => s.discordGuildId).filter(Boolean))

        const results = adminGuilds.map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            hasBot: botGuildIds.has(g.id),
            hasPowServer: existingGuildIds.has(g.id)
        }))

        return NextResponse.json(results)
    } catch (e: any) {
        console.error("Eligible Guilds Error:", e)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
