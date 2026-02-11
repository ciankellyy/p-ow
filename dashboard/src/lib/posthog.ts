import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export default function PostHogClient() {
    if (!posthogClient) {
        posthogClient = new PostHog(
            process.env.NEXT_PUBLIC_POSTHOG_KEY!,
            {
                host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
                // Batch events to avoid per-capture HTTP overhead.
                // POW runs as a persistent PM2 process (not serverless),
                // so batching is safe and significantly reduces network I/O.
                flushAt: 20,
                flushInterval: 10000
            }
        )
    }
    return posthogClient
}

