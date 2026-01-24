import { useState, useCallback, useRef, useEffect } from 'react'
import { createWorker, Worker } from 'tesseract.js'

export function useOcr() {
    const [isProcessing, setIsProcessing] = useState(false)
    const workerRef = useRef<Worker | null>(null)

    // Initialize worker on mount for better performance
    useEffect(() => {
        const initWorker = async () => {
            try {
                const worker = await createWorker('eng')
                workerRef.current = worker
                console.log('Tesseract worker initialized')
            } catch (e) {
                console.error('Failed to initialize Tesseract worker:', e)
            }
        }
        initWorker()

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate()
            }
        }
    }, [])

    const processCapture = useCallback(async (imageDataUrl: string, knownPlayers?: Set<string>): Promise<string | null> => {
        setIsProcessing(true)

        try {
            // Validate the data URL format
            if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image')) {
                console.error('Invalid image data')
                return null
            }

            // Preprocess image for better OCR
            const preprocessImage = (url: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const img = new Image()
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                            reject('No canvas context')
                            return
                        }

                        // Scale up 2.5x for better small text recognition
                        const scale = 2.5
                        canvas.width = img.width * scale
                        canvas.height = img.height * scale

                        // Draw scaled image
                        ctx.imageSmoothingEnabled = false
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        const data = imageData.data

                        for (let i = 0; i < data.length; i += 4) {
                            // Grayscale
                            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

                            // Thresholding
                            const isText = gray > 150
                            const val = isText ? 0 : 255

                            data[i] = val     // R
                            data[i + 1] = val // G
                            data[i + 2] = val // B
                        }

                        ctx.putImageData(imageData, 0, 0)
                        resolve(canvas.toDataURL('image/png'))
                    }
                    img.onerror = (e) => reject(e)
                    img.src = url
                })
            }

            const processedImage = await preprocessImage(imageDataUrl)

            // Wait for worker to be ready
            if (!workerRef.current) {
                const worker = await createWorker('eng')
                await worker.setParameters({
                    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@',
                    tessedit_pageseg_mode: '6', // Assume a uniform block of text (better for multi-word scans)
                })
                workerRef.current = worker
            }

            // Process the preprocessed image
            const result = await workerRef.current.recognize(processedImage)
            const text = result.data.text.trim()
            console.log('OCR Raw Text:', text)

            // Split into candidate words (splitting by whitespace and non-alphanumeric separators)
            const candidates = text.split(/[\s\n]+/).filter(w => w.length >= 3)

            // If we have a known player list, strictly match against it
            if (knownPlayers && knownPlayers.size > 0) {
                console.log(`Matching ${candidates.length} OCR words against ${knownPlayers.size} known players...`)

                let bestMatch: string | null = null
                let bestDistance = 999

                // For every word found in OCR...
                for (const word of candidates) {
                    const cleanWord = word.replace('@', '') // Remove handle matching char

                    // Check against every known player
                    for (const player of knownPlayers) {
                        // Exact match (case insensitive)
                        if (cleanWord.toLowerCase() === player.toLowerCase()) {
                            console.log(`✅ Exact match found: ${player}`)
                            return player
                        }

                        // Fuzzy match (Levenshtein)
                        const dist = getLevenshteinDistance(cleanWord.toLowerCase(), player.toLowerCase())

                        // Allow distance of 1 for words < 5 chars, distance of 2 for longer
                        const maxDist = player.length < 5 ? 1 : 2

                        if (dist <= maxDist && dist < bestDistance) {
                            bestDistance = dist
                            bestMatch = player
                        }
                    }
                }

                if (bestMatch) {
                    console.log(`✅ Fuzzy match found: ${bestMatch} (distance: ${bestDistance})`)
                    return bestMatch
                }

                console.log('❌ No match found in known players list')
                return null
            }

            // Fallback: Regex matching if no player list available (unlikely with polling on)
            console.log('⚠️ No active player list available, falling back to regex')
            const usernamePattern = /@?[A-Za-z0-9_]{3,20}/g
            const matches = text.match(usernamePattern)

            if (matches && matches.length > 0) {
                // Filter out common false positives
                const commonWords = new Set(['THE', 'AND', 'ROBLOX', 'PLAYER', 'MENU', 'admin', 'chat'])
                const bestMatch = matches.find(m => {
                    const clean = m.replace('@', '').toUpperCase()
                    return !commonWords.has(clean) && clean.length >= 3
                })

                if (bestMatch) return bestMatch.replace('@', '')
            }

            return null
        } catch (error) {
            console.error('OCR error:', error)
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [])

    return { processCapture, isProcessing }
}

// Levenshtein distance implementation
function getLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

    for (let i = 0; i <= b.length; i++) matrix[i][0] = i
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const indicator = a[j - 1] === b[i - 1] ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + indicator
            )
        }
    }

    return matrix[b.length][a.length]
}
