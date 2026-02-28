import { getFromCache, setToCache, getFromCacheStale, cacheRobloxUser, getRobloxUserCache } from "./roblox-cache"
import { getGlobalConfig } from "./config"

export interface RobloxUser {
    id: number
    name: string
    displayName: string
    description: string
    created: string
    isBanned: boolean
    hasVerifiedBadge: boolean
    avatar: string | null
}

async function fetchLegacyUserDetails(userId: number) {
    const detailsUrl = `https://users.roblox.com/v1/users/${userId}`
    const detailsRes = await fetch(detailsUrl, {
        headers: { "User-Agent": "ProjectOverwatch/1.0" }
    })

    if (detailsRes.status === 429) throw new Error("RATE_LIMITED")
    if (!detailsRes.ok) throw new Error(`Roblox API error: ${detailsRes.status}`)

    return await detailsRes.json()
}

export async function getRobloxUser(username: string): Promise<RobloxUser | null> {
    const apiKey = (globalThis as any).process?.env?.ROBLOX_API_KEY
    const openCloudBase = await getGlobalConfig("ROBLOX_OPEN_CLOUD_BASE")
    const cacheKey = `roblox:user:${username.toLowerCase()}`

    // 1. Check Cache (fresh)
    const cached = getFromCache<RobloxUser>(cacheKey)
    if (cached) return cached

    try {
        // 2. Look up user by username
        const lookupRes = await fetch(
            `https://users.roblox.com/v1/usernames/users`,
            {
                method: "POST",
                headers: {
                    "User-Agent": "ProjectOverwatch/1.0",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
            }
        )

        if (lookupRes.status === 429) {
            return getFromCacheStale<RobloxUser>(cacheKey)
        }

        if (!lookupRes.ok) return getFromCacheStale<RobloxUser>(cacheKey)

        const lookupData = await lookupRes.json()
        if (!lookupData.data || lookupData.data.length === 0) return null

        const userResult = lookupData.data[0]
        const userId = userResult.id

        // 3. Parallel Fetch: Details + Avatar
        const [userDetails, avatar] = await Promise.all([
            (async () => {
                if (apiKey) {
                    const ocRes = await fetch(`${openCloudBase}/users/${userId}`, {
                        headers: { "x-api-key": apiKey },
                        next: { revalidate: 3600 }
                    } as any)
                    if (ocRes.ok) {
                        const ocData = await ocRes.json()
                        return {
                            id: userId,
                            name: ocData.name || userResult.name,
                            displayName: ocData.displayName || userResult.displayName,
                            description: ocData.about || "",
                            created: ocData.createTime,
                            isBanned: false,
                            hasVerifiedBadge: ocData.idVerified || false
                        }
                    }
                }
                return await fetchLegacyUserDetails(userId)
            })(),
            (async () => {
                // Try Open Cloud first if available
                if (apiKey) {
                    try {
                        const thumbRes = await fetch(
                            `${openCloudBase}/users/${userId}:generateThumbnail`,
                            {
                                method: "POST",
                                headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
                                body: JSON.stringify({ size: "SIZE_420X420", format: "PNG", shape: "ROUND" })
                            }
                        )
                        if (thumbRes.ok) {
                            const thumbData = await thumbRes.json()
                            return thumbData.imageUri || thumbData.response?.imageUri || null
                        }
                    } catch (e) {}
                }
                // Fallback to legacy
                try {
                    const thumbRes = await fetch(
                        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=true`,
                        { next: { revalidate: 3600 } } as any
                    )
                    const thumbData = await thumbRes.json()
                    return thumbData.data?.[0]?.imageUrl || null
                } catch (e) {
                    return null
                }
            })()
        ])

        const result: RobloxUser = {
            id: userId,
            name: userDetails.name || "",
            displayName: userDetails.displayName || "",
            description: userDetails.description || "",
            created: userDetails.created || "",
            isBanned: userDetails.isBanned || false,
            hasVerifiedBadge: userDetails.hasVerifiedBadge || false,
            avatar
        }

        cacheRobloxUser(username, userId, result)
        return result

    } catch (e: any) {
        if (e?.message === "RATE_LIMITED") return getFromCacheStale<RobloxUser>(cacheKey)
        return null
    }
}

export async function getRobloxUserById(userId: number): Promise<RobloxUser | null> {
    const idCacheKey = `roblox:user:id:${userId}`
    const cached = getFromCache<RobloxUser>(idCacheKey)
    if (cached) return cached

    try {
        const [userDetails, avatar] = await Promise.all([
            fetchLegacyUserDetails(userId),
            (async () => {
                try {
                    const thumbRes = await fetch(
                        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=true`,
                        { next: { revalidate: 3600 } } as any
                    )
                    const thumbData = await thumbRes.json()
                    return thumbData.data?.[0]?.imageUrl || null
                } catch (e) { return null }
            })()
        ])

        if (!userDetails || userDetails.errors) return getFromCacheStale<RobloxUser>(idCacheKey)

        const result: RobloxUser = {
            id: userId,
            name: userDetails.name || "",
            displayName: userDetails.displayName || "",
            description: userDetails.description || "",
            created: userDetails.created || "",
            isBanned: userDetails.isBanned || false,
            hasVerifiedBadge: userDetails.hasVerifiedBadge || false,
            avatar
        }

        cacheRobloxUser(result.name, userId, result)
        return result

    } catch (e: any) {
        return getFromCacheStale<RobloxUser>(idCacheKey)
    }
}
