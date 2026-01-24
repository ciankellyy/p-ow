import crypto from "crypto"

// Shared secret for HMAC verification - set in production
const VISION_HMAC_SECRET = process.env.VISION_HMAC_SECRET || "REMOVED_VISION_HMAC_SECRET"

/**
 * Verifies the HMAC signature from Vision app headers.
 * Format: X-Vision-Sig: timestamp:instanceId:signature
 * Signature = HMAC-SHA256(timestamp:instanceId, secret)
 */
export function verifyVisionSignature(header: string | null): boolean {
    if (!header) return false

    const parts = header.split(':')
    if (parts.length !== 3) return false

    const [timestamp, instanceId, signature] = parts
    const ts = parseInt(timestamp, 10)

    // Check timestamp is within 5 minutes (allows for clock drift)
    const now = Date.now()
    if (isNaN(ts) || Math.abs(now - ts) > 300000) {
        return false
    }

    // Compute expected signature
    const message = `${timestamp}:${instanceId}`
    const expectedSig = crypto
        .createHmac('sha256', VISION_HMAC_SECRET)
        .update(message)
        .digest('hex')

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
    )
}

export const visionCorsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Vision-Sig"
}
