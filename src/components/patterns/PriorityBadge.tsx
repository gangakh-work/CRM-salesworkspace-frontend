import { Badge } from '@/components/ui/badge'

export type PriorityLevel = 'high' | 'medium' | 'low'

const PRIORITY_VARIANT = {
  high: 'error' as const,
  medium: 'warning' as const,
  low: 'neutral' as const,
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className="capitalize">
      {priority}
    </Badge>
  )
}
