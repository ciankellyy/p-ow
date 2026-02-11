import PostHogClient from "./posthog"

/**
 * Lightweight metrics tracking via PostHog custom events.
 * All metrics use distinctId "pow-system" (system actor).
 * 
 * Events:
 * - `metric_api_call` — External/internal API call timing
 * - `metric_sync_cycle` — Log sync cycle timing
 * - `metric_db_query` — Database query timing
 */

const SYSTEM_ACTOR = "pow-system"

// Debounce DB metrics to avoid overwhelming PostHog
const MAX_DB_BUFFER_SIZE = 1000
let dbMetricBuffer: { model: string; action: string; duration: number }[] = []
let dbFlushTimer: ReturnType<typeof setTimeout> | null = null

export function trackApiCall(
    service: "prc" | "clerk" | "pow-api" | "roblox" | "posthog",
    endpoint: string,
    durationMs: number,
    status: "ok" | "error" | "timeout",
    errorMessage?: string
) {
    try {
        const posthog = PostHogClient()
        posthog.capture({
            distinctId: SYSTEM_ACTOR,
            event: "metric_api_call",
            properties: {
                service,
                endpoint,
                duration_ms: Math.round(durationMs),
                status,
                error_message: errorMessage || null,
                timestamp_iso: new Date().toISOString()
            }
        })
    } catch {
        // Never let metrics crash the app
    }
}

export function trackSyncCycle(
    serverId: string,
    durationMs: number,
    newLogsCount: number,
    status: "ok" | "error",
    errorMessage?: string
) {
    try {
        const posthog = PostHogClient()
        posthog.capture({
            distinctId: SYSTEM_ACTOR,
            event: "metric_sync_cycle",
            properties: {
                server_id: serverId,
                duration_ms: Math.round(durationMs),
                new_logs_count: newLogsCount,
                status,
                error_message: errorMessage || null,
                timestamp_iso: new Date().toISOString()
            }
        })
    } catch {
        // Never let metrics crash the app
    }
}

export function trackDbQuery(model: string, action: string, durationMs: number) {
    // Buffer DB metrics and flush every 5 seconds to avoid event spam
    dbMetricBuffer.push({ model, action, duration: Math.round(durationMs) })

    // Cap buffer size to prevent unbounded memory growth
    if (dbMetricBuffer.length >= MAX_DB_BUFFER_SIZE) {
        if (dbFlushTimer) clearTimeout(dbFlushTimer)
        dbFlushTimer = null
        flushDbMetrics()
        return
    }

    if (!dbFlushTimer) {
        dbFlushTimer = setTimeout(() => {
            flushDbMetrics()
            dbFlushTimer = null
        }, 5000)
    }
}

function flushDbMetrics() {
    if (dbMetricBuffer.length === 0) return

    try {
        const posthog = PostHogClient()

        // Aggregate: avg duration per model.action
        const groups = new Map<string, { total: number; count: number; max: number }>()
        for (const m of dbMetricBuffer) {
            const key = `${m.model}.${m.action}`
            const g = groups.get(key) || { total: 0, count: 0, max: 0 }
            g.total += m.duration
            g.count++
            g.max = Math.max(g.max, m.duration)
            groups.set(key, g)
        }

        for (const [key, g] of groups) {
            posthog.capture({
                distinctId: SYSTEM_ACTOR,
                event: "metric_db_query",
                properties: {
                    query: key,
                    avg_duration_ms: Math.round(g.total / g.count),
                    max_duration_ms: g.max,
                    count: g.count,
                    timestamp_iso: new Date().toISOString()
                }
            })
        }
    } catch {
        // Never let metrics crash the app
    }

    dbMetricBuffer = []
}
