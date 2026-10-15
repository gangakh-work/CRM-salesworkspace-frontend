import { useCallback, useMemo, useState } from 'react'

import { STORAGE_KEYS } from '@/config/constants'
import {
  DEFAULT_WIDGET_ORDER,
  type DashboardSettings,
  type DashboardWidgetId,
} from '@/features/dashboard/types/dashboard.types'

const DEFAULT_SETTINGS: DashboardSettings = {
  widgetOrder: DEFAULT_WIDGET_ORDER,
  collapsedSections: {},
}

function loadDashboardSettings(): DashboardSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.dashboardSettings)
    if (stored) {
      const parsed = JSON.parse(stored) as DashboardSettings
      return {
        widgetOrder: parsed.widgetOrder ?? DEFAULT_WIDGET_ORDER,
        collapsedSections: parsed.collapsedSections ?? {},
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

function persistDashboardSettings(settings: DashboardSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.dashboardSettings, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(loadDashboardSettings)

  const updateSettings = useCallback((partial: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      persistDashboardSettings(next)
      return next
    })
  }, [])

  const toggleSection = useCallback((id: DashboardWidgetId) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        collapsedSections: {
          ...prev.collapsedSections,
          [id]: !prev.collapsedSections[id],
        },
      }
      persistDashboardSettings(next)
      return next
    })
  }, [])

  const moveWidget = useCallback((id: DashboardWidgetId, direction: 'up' | 'down') => {
    setSettings((prev) => {
      const order = [...prev.widgetOrder]
      const index = order.indexOf(id)
      if (index === -1) return prev

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= order.length) return prev

      ;[order[index], order[targetIndex]] = [order[targetIndex], order[index]]
      const next = { ...prev, widgetOrder: order }
      persistDashboardSettings(next)
      return next
    })
  }, [])

  const resetLayout = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    persistDashboardSettings(DEFAULT_SETTINGS)
  }, [])

  const isCollapsed = useCallback(
    (id: DashboardWidgetId) => settings.collapsedSections[id] ?? false,
    [settings.collapsedSections],
  )

  return useMemo(
    () => ({
      settings,
      widgetOrder: settings.widgetOrder,
      updateSettings,
      toggleSection,
      moveWidget,
      resetLayout,
      isCollapsed,
    }),
    [settings, updateSettings, toggleSection, moveWidget, resetLayout, isCollapsed],
  )
}
