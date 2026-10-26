import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { STORAGE_KEYS } from '@/config/constants'

interface SidebarContextValue {
  collapsed: boolean
  mobileOpen: boolean
  /** True when the sidebar overlay is visible on workspace pages */
  hoverOpen: boolean
  pinnedOpen: boolean
  togglePinnedOpen: () => void
  closePinnedOpen: () => void
  toggleCollapsed: () => void
  setCollapsed: (value: boolean) => void
  /** Open the hover sidebar immediately */
  openHover: () => void
  /** Close the hover sidebar — with a small delay so the mouse can travel between the trigger and the sidebar without flickering */
  closeHover: () => void
  openMobile: () => void
  closeMobile: () => void
  toggleMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === 'true'
  } catch {
    return false
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [pinnedOpen, setPinnedOpen] = useState(false)

  // Timer ref used to debounce the close so mouse can travel between
  // the TopNav trigger and the sidebar without the sidebar disappearing.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    try {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(value))
    } catch {
      /* storage unavailable */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  const openHover = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setHoverOpen(true)
  }, [])

  const closeHover = useCallback(() => {
    if (pinnedOpen) return
    // 120 ms grace period — enough to move from the button into the sidebar
    closeTimerRef.current = setTimeout(() => {
      setHoverOpen(false)
      closeTimerRef.current = null
    }, 120)
  }, [pinnedOpen])

  const togglePinnedOpen = useCallback(() => {
    setPinnedOpen((current) => {
      const next = !current
      setHoverOpen(next)
      return next
    })
  }, [])

  const closePinnedOpen = useCallback(() => {
    setPinnedOpen(false)
    setHoverOpen(false)
  }, [])

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      mobileOpen,
      hoverOpen,
      pinnedOpen,
      togglePinnedOpen,
      closePinnedOpen,
      toggleCollapsed,
      setCollapsed,
      openHover,
      closeHover,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
      toggleMobile: () => setMobileOpen((prev) => !prev),
    }),
    [
      collapsed,
      mobileOpen,
      hoverOpen,
      pinnedOpen,
      toggleCollapsed,
      setCollapsed,
      openHover,
      closeHover,
      togglePinnedOpen,
      closePinnedOpen,
    ],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }
  return context
}
