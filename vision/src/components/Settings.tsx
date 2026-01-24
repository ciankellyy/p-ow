import { useState, useEffect, useRef } from 'react'

interface SettingsProps {
    onBack: () => void
    onLogout: () => void
    onHotkeyChange?: (scanHotkey: string, toggleHotkey: string) => void
}

export function Settings({ onBack, onLogout, onHotkeyChange }: SettingsProps) {
    const [hotkey, setHotkey] = useState('Alt+V')
    const [toggleHotkey, setToggleHotkey] = useState('Alt+Shift+V')
    const [opacity, setOpacity] = useState(95)
    const [recordingFor, setRecordingFor] = useState<'scan' | 'toggle' | null>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await window.electronAPI.getSettings()
            setHotkey(settings.hotkey)
            setToggleHotkey(settings.toggleHotkey)
            setOpacity(Math.round(settings.overlayOpacity * 100))
        }
        loadSettings()
    }, [])

    // Auto-save when hotkey changes
    const updateHotkey = async (newHotkey: string, type: 'scan' | 'toggle') => {
        if (type === 'scan') {
            setHotkey(newHotkey)
            await window.electronAPI.setSettings({ hotkey: newHotkey })
            onHotkeyChange?.(newHotkey, toggleHotkey)
        } else {
            setToggleHotkey(newHotkey)
            await window.electronAPI.setSettings({ toggleHotkey: newHotkey })
            onHotkeyChange?.(hotkey, newHotkey)
        }
    }

    // Auto-save opacity with debounce
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(async () => {
            await window.electronAPI.setSettings({ overlayOpacity: opacity / 100 })
        }, 300)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [opacity])

    const handleHotkeyRecord = (type: 'scan' | 'toggle') => {
        setRecordingFor(type)

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const parts: string[] = []

            if (e.ctrlKey) parts.push('Control')
            if (e.altKey) parts.push('Alt')
            if (e.shiftKey) parts.push('Shift')
            if (e.metaKey) parts.push('Meta')

            const code = e.code
            const modifiers = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight']

            if (!modifiers.includes(code)) {
                let keyName = code
                if (code.startsWith('Key')) {
                    keyName = code.replace('Key', '')
                } else if (code.startsWith('Digit')) {
                    keyName = code.replace('Digit', '')
                } else if (code.startsWith('Numpad')) {
                    keyName = 'Num' + code.replace('Numpad', '')
                } else {
                    const specialKeys: Record<string, string> = {
                        'Space': 'Space',
                        'Enter': 'Enter',
                        'Escape': 'Escape',
                        'Backspace': 'Backspace',
                        'Tab': 'Tab',
                        'ArrowUp': 'Up',
                        'ArrowDown': 'Down',
                        'ArrowLeft': 'Left',
                        'ArrowRight': 'Right',
                    }
                    keyName = specialKeys[code] || code
                }
                parts.push(keyName)
            }

            if (parts.length > 0 && !['Control', 'Alt', 'Shift', 'Meta'].includes(parts[parts.length - 1])) {
                const newHotkey = parts.join('+')
                updateHotkey(newHotkey, type)
                setRecordingFor(null)
                document.removeEventListener('keydown', handleKeyDown)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-4 text-sm"
            >
                <BackIcon />
                Back
            </button>

            <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Scan Hotkey */}
                <div>
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">Scan Hotkey</label>
                    <button
                        onClick={() => handleHotkeyRecord('scan')}
                        className={`w-full bg-pow-card border rounded-lg px-4 py-3 text-left transition-colors ${recordingFor === 'scan' ? 'border-indigo-500 text-indigo-400' : 'border-pow-border text-white'
                            }`}
                    >
                        {recordingFor === 'scan' ? 'Press key combination...' : hotkey}
                    </button>
                    <p className="text-white/30 text-xs mt-1">Triggers OCR scan when pressed</p>
                </div>

                {/* Toggle Hotkey */}
                <div>
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">Toggle Hotkey</label>
                    <button
                        onClick={() => handleHotkeyRecord('toggle')}
                        className={`w-full bg-pow-card border rounded-lg px-4 py-3 text-left transition-colors ${recordingFor === 'toggle' ? 'border-indigo-500 text-indigo-400' : 'border-pow-border text-white'
                            }`}
                    >
                        {recordingFor === 'toggle' ? 'Press key combination...' : toggleHotkey}
                    </button>
                    <p className="text-white/30 text-xs mt-1">Shows/hides the overlay panel</p>
                </div>

                {/* Opacity Setting */}
                <div>
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">Overlay Opacity: {opacity}%</label>
                    <input
                        type="range"
                        min="50"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                    />
                </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-pow-border">
                <button
                    onClick={onLogout}
                    className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
                >
                    Log Out
                </button>
            </div>
        </div>
    )
}

function BackIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    )
}
