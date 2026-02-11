import { NextResponse } from "next/server"
import { trackApiCall } from "./metrics"

/**
 * Wraps a Next.js API route handler with response time tracking.
 * Usage: export const GET = withMetrics("/api/logs", async (req) => { ... })
 */
export function withMetrics(
    pathname: string,
    handler: (req: Request, context?: any) => Promise<NextResponse | Response>
) {
    return async (req: Request, context?: any) => {
        const start = Date.now()
        try {
            const response = await handler(req, context)
            const duration = Date.now() - start
            // .status exists on both Response and NextResponse
            const statusCode = response.status || 200
            trackApiCall("pow-api", pathname, duration, statusCode >= 400 ? "error" : "ok", statusCode >= 400 ? `HTTP ${statusCode}` : undefined)
            return response
        } catch (error: any) {
            const duration = Date.now() - start
            trackApiCall("pow-api", pathname, duration, "error", error.message)
            throw error
        }
    }
}

