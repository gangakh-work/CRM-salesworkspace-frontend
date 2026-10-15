import { Breadcrumb as UiBreadcrumb } from '@/components/ui/breadcrumb'
import { useNavigation } from '@/hooks/useNavigation'
import { useSettings } from '@/hooks/useSettings'

export function AppBreadcrumb() {
  const { breadcrumbs } = useNavigation()
  const { settings } = useSettings()

  if (!settings.showBreadcrumbs || breadcrumbs.length <= 1) {
    return null
  }

  return <UiBreadcrumb items={breadcrumbs} className="mb-4" />
}
