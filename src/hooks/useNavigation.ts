import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { getFeatureByPath, getNavigationGroups } from '@/config'
import type { FeatureDefinition } from '@/config/feature-registry'
import { getFlatNavigation } from '@/config/navigation'

export function useNavigation() {
  const location = useLocation()

  const currentFeature = useMemo(
    () => getFeatureByPath(location.pathname),
    [location.pathname],
  )

  const groups = useMemo(() => getNavigationGroups(), [])
  const items = useMemo(() => getFlatNavigation(), [])

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const getBreadcrumbs = (): Array<{ label: string; href?: string }> => {
    const crumbs: Array<{ label: string; href?: string }> = [{ label: 'Home', href: '/dashboard' }]
    if (currentFeature) {
      crumbs.push({ label: currentFeature.label })
    }
    return crumbs
  }

  return {
    groups,
    items,
    currentFeature: currentFeature as FeatureDefinition | undefined,
    currentPath: location.pathname,
    isActive,
    breadcrumbs: getBreadcrumbs(),
  }
}
