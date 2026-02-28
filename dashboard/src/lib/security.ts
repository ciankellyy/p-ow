
import { prisma } from "./db"
import { NextResponse } from "next/server"
import { getGlobalConfig } from "./config"

// Memory persistence using globalThis
const globalForSecurity = globalThis as unknown as {
    ipCounters: Map<string, { count: number, resetAt: number }> | undefined;
};

const ipCounters = globalForSecurity.ipCounters ??= new Map<string, { count: number, resetAt: number }>()

/**
 * Checks if an IP is banned and tracks its request count for rate limiting.
 * Returns a response if blocked/banned, otherwise returns null to proceed.
 */
export async function checkSecurity(req: Request): Promise<NextResponse | null> {
    const maxRequests = await getGlobalConfig("MAX_REQUESTS_PER_MINUTE")
    const banReason = await getGlobalConfig("BAN_REASON")

    // Robust IP detection - check multiple headers common in proxy setups
    const forwarded = req.headers.get("x-forwarded-for")
    const realIp = req.headers.get("x-real-ip")
    const cfIp = req.headers.get("cf-connecting-ip") // For Cloudflare
    
    let ip = "unknown"
    if (cfIp) ip = cfIp
    else if (realIp) ip = realIp
    else if (forwarded) ip = forwarded.split(',')[0].trim()

    console.log(`[SECURITY] Checking request from IP: ${ip}`)

    // Basic IP validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/
    if (ip === "unknown" || !ipRegex.test(ip)) {
        console.warn(`[SECURITY] Invalid or missing IP detected: ${ip}`)
        // We still allow 'unknown' to proceed but we don't track it to avoid memory pollution
        return null 
    }

    // 1. Check if IP is already banned in database
    const banned = await prisma.bannedIp.findUnique({
        where: { ip }
    })

    if (banned) {
        console.warn(`[SECURITY] Blocked request from banned IP: ${ip} (reason: ${banned.reason})`)
        return new NextResponse("Forbidden: Access denied.", { status: 403 })
    }

    // 2. IP Rate Limiting (Anti-Scraping)
    const now = Date.now()
    const tracker = ipCounters.get(ip)

    if (!tracker || tracker.resetAt < now) {
        // First request or counter expired
        ipCounters.set(ip, { count: 1, resetAt: now + 60000 })
        console.log(`[SECURITY] New/reset counter for IP ${ip}`)
    } else {
        // Increment counter
        tracker.count++
        console.log(`[SECURITY] IP ${ip} request count: ${tracker.count}/${maxRequests}`)

        if (tracker.count > maxRequests) {
            // AUTO-BAN logic
            console.error(`[SECURITY] IP ${ip} exceeded rate limit (${tracker.count}/${maxRequests}). AUTO-BANNING.`)

            try {
                // Save to database
                await prisma.bannedIp.upsert({
                    where: { ip },
                    update: { reason: banReason },
                    create: { ip, reason: banReason }
                })

                // Log the security event
                await prisma.securityLog.create({
                    data: {
                        event: "IP_BANNED",
                        ip,
                        details: `Rate limit hit: ${tracker.count} req/min`
                    }
                })
                console.log(`[SECURITY] IP ${ip} banned and saved to database`)
            } catch (e) {
                console.error("[SECURITY] Failed to save ban to DB:", e)
            }

            return new NextResponse("Forbidden: Too many requests. You have been banned.", { status: 403 })
        }
    }

    console.log(`[SECURITY] IP ${ip} passed all checks`)
    return null
}

/**
 * Clean up expired counters periodically to prevent memory leaks
 */
if (!globalForSecurity.ipCounters) {
    setInterval(() => {
        const now = Date.now()
        for (const [ip, tracker] of ipCounters.entries()) {
            if (tracker.resetAt < now) {
                ipCounters.delete(ip)
            }
        }
    }, 300000) // Every 5 minutes
}
