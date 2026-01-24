// Global in-memory store for handshake codes
// Using globalThis to ensure persistence across Hot Module Reloads in development
// Note: This only works on persistent servers (VPS/Docker). NOT Serverless/Vercel.

const globalStore = globalThis as unknown as {
    _handshakeCodes: Map<string, { expiresAt: number }>
}

if (!globalStore._handshakeCodes) {
    globalStore._handshakeCodes = new Map()
}

export const handshakeCodes = globalStore._handshakeCodes
