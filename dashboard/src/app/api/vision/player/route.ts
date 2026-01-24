import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

const VISION_SECRET = new TextEncoder().encode(
    process.env.VISION_JWT_SECRET || "REMOVED_VISION_JWT_SECRET"
)

// Lookup player by username
export async function GET(req: Request) {
    try {
        // Verify Vision token from Authorization header
        const authHeader = req.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No token provided" }, { status: 401 })
        }

        const token = authHeader.substring(7)
        try {
            await jwtVerify(token, VISION_SECRET, {
                issuer: "pow-dashboard",
                audience: "pow-vision"
            })
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // Get username from query
        const url = new URL(req.url)
        const username = url.searchParams.get("username")

        if (!username) {
            return NextResponse.json({ error: "Username required" }, { status: 400 })
        }

        // Lookup user on Roblox
        const robloxRes = await fetch(
            `https://users.roblox.com/v1/usernames/users`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: false
                })
            }
        )

        if (!robloxRes.ok) {
            return NextResponse.json({ error: "Failed to lookup user" }, { status: 502 })
        }

        const robloxData = await robloxRes.json()
        const userData = robloxData.data?.[0]

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get avatar
        let avatar = null
        try {
            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=150x150&format=Png&isCircular=false`
            )
            if (avatarRes.ok) {
                const avatarData = await avatarRes.json()
                avatar = avatarData.data?.[0]?.imageUrl || null
            }
        } catch {
            // Avatar fetch failed, continue without it
        }

        // Get punishment count from database (across all servers) using Roblox ID
        const robloxIdStr = String(userData.id)
        const punishmentCount = await prisma.punishment.count({
            where: {
                userId: robloxIdStr
            }
        })

        // Get recent punishments (last 5)
        const recentPunishments = await prisma.punishment.findMany({
            where: {
                userId: robloxIdStr
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                type: true,
                reason: true,
                createdAt: true,
                resolved: true
            }
        })

        return NextResponse.json({
            id: userData.id,
            name: userData.name,
            displayName: userData.displayName,
            avatar,
            punishmentCount,
            recentPunishments
        })
    } catch (error) {
        console.error("[Vision Player] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
