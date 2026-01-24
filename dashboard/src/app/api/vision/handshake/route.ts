import { NextResponse } from "next/server"
import crypto from "crypto"
import { verifyVisionSignature, visionCorsHeaders } from "@/lib/vision-auth"
import { handshakeCodes } from "@/lib/handshake-store"

// Cleanup expired codes periodically
function cleanupExpired() {
    const now = Date.now()
    for (const [code, data] of handshakeCodes.entries()) {
        if (now > data.expiresAt) {
            handshakeCodes.delete(code)
        }
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: visionCorsHeaders })
}

// Generate a one-time handshake code for Vision auth
export async function POST(req: Request) {
    try {
        // Verify the request is from Vision app using HMAC signature
        const signature = req.headers.get("X-Vision-Sig")
        if (!verifyVisionSignature(signature)) {
            console.log("[Vision Handshake] Invalid signature:", signature?.substring(0, 50))
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403, headers: visionCorsHeaders }
            )
        }

        cleanupExpired()

        // Generate a random code
        const code = crypto.randomBytes(32).toString('hex')

        // Store with 5 minute expiry
        handshakeCodes.set(code, {
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        })

        return NextResponse.json({ code }, { headers: visionCorsHeaders })
    } catch (error) {
        console.error("[Vision Handshake] Error:", error)
        return NextResponse.json({ error: "Failed to create handshake" }, { status: 500, headers: visionCorsHeaders })
    }
}

// Validate and consume a handshake code
export async function GET(req: Request) {
    try {
        cleanupExpired()

        const url = new URL(req.url)
        const code = url.searchParams.get("code")

        if (!code) {
            return NextResponse.json({ valid: false }, { headers: visionCorsHeaders })
        }

        const handshake = handshakeCodes.get(code)

        if (!handshake) {
            return NextResponse.json({ valid: false }, { headers: visionCorsHeaders })
        }

        if (Date.now() > handshake.expiresAt) {
            handshakeCodes.delete(code)
            return NextResponse.json({ valid: false, error: "expired" }, { headers: visionCorsHeaders })
        }

        // Consume the code (one-time use)
        handshakeCodes.delete(code)

        return NextResponse.json({ valid: true }, { headers: visionCorsHeaders })
    } catch (error) {
        console.error("[Vision Handshake] Validate error:", error)
        return NextResponse.json({ valid: false }, { status: 500, headers: visionCorsHeaders })
    }
}

// Export the map for the vision-auth page to use
export { handshakeCodes }
