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

    const processCapture = useCallback(async (imageDataUrl: string): Promise<string | null> => {
        setIsProcessing(true)

        try {
            // Validate the data URL format
            if (!imageDataUrl || typeof imageDataUrl !== 'string') {
                console.error('Invalid image data: not a string')
                return null
            }

            if (!imageDataUrl.startsWith('data:image')) {
                console.error('Invalid image data: not a data URL, starts with:', imageDataUrl.substring(0, 50))
                return null
            }

            console.log('Processing image, dataURL length:', imageDataUrl.length)

            // Wait for worker to be ready
            if (!workerRef.current) {
                console.log('Worker not ready, initializing...')
                const worker = await createWorker('eng')
                workerRef.current = worker
            }

            // Process directly with the dataURL - Tesseract.js supports data URLs
            const result = await workerRef.current.recognize(imageDataUrl)
            const text = result.data.text

            console.log('OCR detected text length:', text.length)
            console.log('OCR text preview:', text.substring(0, 300))

            // Roblox usernames: 3-20 chars, alphanumeric + underscore, must start with letter
            const usernamePattern = /[A-Za-z][A-Za-z0-9_]{2,19}/g
            const matches = text.match(usernamePattern)

            if (matches && matches.length > 0) {
                // Filter out common false positives
                const commonWords = new Set([
                    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
                    'WAS', 'ONE', 'OUR', 'OUT', 'HAS', 'HAD', 'HIS', 'HIM', 'SHE', 'HER',
                    'ITS', 'WHO', 'HOW', 'NOW', 'NEW', 'GET', 'GOT', 'DID', 'SAY', 'SAW',
                    'SEE', 'USE', 'WAY', 'MAY', 'DAY', 'TOO', 'ANY', 'BEEN', 'CALL', 'COME',
                    'COULD', 'EACH', 'FIND', 'FIRST', 'FROM', 'HAVE', 'INTO', 'JUST', 'KNOW',
                    'LIKE', 'LOOK', 'MADE', 'MAKE', 'MORE', 'MOST', 'MUST', 'NAME', 'ONLY',
                    'OVER', 'PART', 'PEOPLE', 'SAID', 'SOME', 'THAN', 'THAT', 'THEM', 'THEN',
                    'THERE', 'THESE', 'THEY', 'THIS', 'TIME', 'VERY', 'WANT', 'WATER', 'WHAT',
                    'WHEN', 'WHERE', 'WHICH', 'WILL', 'WITH', 'WORD', 'WORK', 'WOULD', 'YEAR',
                    'YOUR', 'ROBLOX', 'PLAYER', 'TEAM', 'GAME', 'SERVER', 'ONLINE', 'OFFLINE',
                    'MENU', 'FILE', 'EDIT', 'VIEW', 'HELP', 'TOOLS', 'WINDOW', 'HOME', 'BACK',
                    'NEXT', 'PREV', 'CLOSE', 'OPEN', 'SAVE', 'LOAD', 'EXIT', 'QUIT', 'START',
                    'STOP', 'PLAY', 'PAUSE', 'OPTIONS', 'SETTINGS', 'PREFERENCES'
                ])

                const filtered = matches.filter(m =>
                    !commonWords.has(m.toUpperCase()) && m.length >= 3
                )

                if (filtered.length > 0) {
                    console.log('Detected username candidates:', filtered.slice(0, 5))
                    return filtered[0]
                }
            }

            console.log('No valid username found in OCR text')
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
