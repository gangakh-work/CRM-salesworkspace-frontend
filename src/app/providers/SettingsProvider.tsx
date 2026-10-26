import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { STORAGE_KEYS } from '@/config/constants'

export interface AppSettings {
  compactMode: boolean
  showBreadcrumbs: boolean
  animationsEnabled: boolean
  /** Optional ThreeUI Energy Orb behind every page. */
  animatedBackground: boolean
}

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  compactMode: false,
  showBreadcrumbs: true,
  animationsEnabled: true,
  animatedBackground: false,
}

const SETTINGS_CHANGED_EVENT = 'sw:settings-changed' // also read by ThemeProvider

const SettingsContext = createContext<SettingsContextValue | null>(null)

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const persist = useCallback((next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    // Lets providers mounted above this one (the theme) react to changes.
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT))
  }, [])

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    persist(DEFAULT_SETTINGS)
  }, [persist])

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider')
  }
  return context
}
