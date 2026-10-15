import { Construction } from 'lucide-react'
import { useMemo } from 'react'

import { EmptyState } from '@/components/global/EmptyState'
import { Badge } from '@/components/ui/badge'
import { getFeatureById } from '@/config/feature-registry'

interface ComingSoonPageProps {
  featureId?: string
}

export function ComingSoonPage({ featureId }: ComingSoonPageProps) {
  const feature = useMemo(
    () => (featureId ? getFeatureById(featureId) : undefined),
    [featureId],
  )

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={feature?.icon ?? Construction}
        title={feature ? `${feature.label} — Coming Soon` : 'Coming Soon'}
        description={
          feature?.description ??
          'This module is registered in the feature registry and will be implemented in a future release.'
        }
        action={
          feature?.badge ? (
            <Badge variant="secondary">{feature.badge}</Badge>
          ) : undefined
        }
      />
    </div>
  )
}
