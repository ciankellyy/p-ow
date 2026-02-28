import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const client = await clerkClient()
        const url = new URL(req.url)
        const userId = url.searchParams.get("userId")
        if (!userId) return new NextResponse("No userId", { status: 400 })

        const provider = "oauth_discord"
        const tokens = await client.users.getUserOauthAccessToken(userId, provider)
        return NextResponse.json({ tokens: tokens.data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
