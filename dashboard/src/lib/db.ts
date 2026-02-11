import { PrismaClient } from '@prisma/client'
import { trackDbQuery } from './metrics'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; _metricsAttached?: boolean }

export const prisma = globalForPrisma.prisma || new PrismaClient()

// Track DB query performance — guard against duplicate registration on HMR/cached client
if (!globalForPrisma._metricsAttached) {
    prisma.$use(async (params, next) => {
        const start = Date.now()
        const result = await next(params)
        const duration = Date.now() - start
        trackDbQuery(params.model || 'unknown', params.action, duration)
        return result
    })
    globalForPrisma._metricsAttached = true
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


