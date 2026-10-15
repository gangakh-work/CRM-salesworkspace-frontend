import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useSyncExternalStore, type ReactNode } from 'react'

import { STORAGE_KEYS } from '@/config/constants'

interface ThemeProviderProps {
  children: ReactNode
}

const SETTINGS_CHANGED_EVENT = 'sw:settings-changed'

/** Read `animatedBackground` from persisted settings (default on). */
function readAnimatedBackground(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings)
    if (stored) return (JSON.parse(stored) as { animatedBackground?: boolean }).animatedBackground !== false
  } catch {
    /* ignore */
  }
  return true
}

function subscribe(onChange: () => void) {
  window.addEventListener(SETTINGS_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(SETTINGS_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // The Energy Orb backdrop is a dark scene; while it is on, the app renders
  // in dark mode so text and surfaces stay legible on top of it.
  const animatedBackground = useSyncExternalStore(subscribe, readAnimatedBackground, () => true)

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={animatedBackground ? 'dark' : undefined}
    >
      {children}
    </NextThemesProvider>
  )
}
