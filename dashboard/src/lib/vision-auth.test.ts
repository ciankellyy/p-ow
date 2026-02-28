
describe('verifyVisionSignature', () => {
    let verifyVisionSignature: any
    const originalEnv = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
        process.env.VISION_HMAC_SECRET = 'test-secret'

        // Dynamic import to pick up new env
        verifyVisionSignature = require('./vision-auth').verifyVisionSignature
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('should return true for valid signature', () => {
        const crypto = require('crypto')
        const timestamp = Date.now().toString()
        const instanceId = 'test-instance'
        const message = `${timestamp}:${instanceId}`
        const signature = crypto
            .createHmac('sha256', 'test-secret')
            .update(message)
            .digest('hex')

        const header = `${timestamp}:${instanceId}:${signature}`
        expect(verifyVisionSignature(header)).toBe(true)
    })

    it('should return false for invalid signature', () => {
        const timestamp = Date.now().toString()
        const instanceId = 'test-instance'
        const signature = 'invalid-signature'

        const header = `${timestamp}:${instanceId}:${signature}`
        expect(verifyVisionSignature(header)).toBe(false)
    })

    it('should return false for expired timestamp', () => {
        const crypto = require('crypto')
        const timestamp = (Date.now() - 600000).toString() // 10 minutes ago
        const instanceId = 'test-instance'
        const message = `${timestamp}:${instanceId}`
        const signature = crypto
            .createHmac('sha256', 'test-secret')
            .update(message)
            .digest('hex')

        const header = `${timestamp}:${instanceId}:${signature}`
        expect(verifyVisionSignature(header)).toBe(false)
    })

    it('should return false (and not crash) for signature of incorrect length', () => {
        const timestamp = Date.now().toString()
        const instanceId = 'test-instance'
        const signature = 'short'

        const header = `${timestamp}:${instanceId}:${signature}`
        expect(() => verifyVisionSignature(header)).not.toThrow()
        expect(verifyVisionSignature(header)).toBe(false)
    })
})
