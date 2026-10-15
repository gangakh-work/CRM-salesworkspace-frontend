import { Badge } from '@/components/ui/badge'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  ForecastCategory,
  OpportunityRisk,
  OpportunityStage,
  OpportunityStatus,
} from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'

export { PriorityBadge } from '@/components/patterns/PriorityBadge'

export function RiskBadge({ risk }: { risk: OpportunityRisk }) {
  const variant = { high: 'error' as const, medium: 'warning' as const, low: 'success' as const }
  return (
    <Badge variant={variant[risk]} className="capitalize">
      {risk}
    </Badge>
  )
}

const STAGE_VARIANT: Record<OpportunityStage, 'success' | 'error' | 'info' | 'warning' | 'secondary' | 'neutral'> = {
  prospect: 'neutral',
  qualification: 'secondary',
  discovery: 'info',
  proposal: 'info',
  commercial_review: 'info',
  negotiation: 'warning',
  legal_review: 'warning',
  won: 'success',
  lost: 'error',
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{formatStage(stage)}</Badge>
}

const FORECAST_LABELS: Record<ForecastCategory, string> = {
  pipeline: 'Pipeline',
  best_case: 'Best Case',
  commit: 'Commit',
  closed: 'Closed',
  omitted: 'Omitted',
}

export function ForecastBadge({ category }: { category: ForecastCategory }) {
  const variant =
    category === 'commit'
      ? 'success'
      : category === 'best_case'
        ? 'info'
        : category === 'closed'
          ? 'secondary'
          : category === 'omitted'
            ? 'error'
            : 'neutral'
  return <Badge variant={variant}>{FORECAST_LABELS[category]}</Badge>
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const variant = status === 'won' ? 'success' : status === 'lost' ? 'error' : 'info'
  return <Badge variant={variant} className="capitalize">{status}</Badge>
}

export function ProbabilityBadge({ probability }: { probability: number }) {
  const color =
    probability >= 70
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : probability >= 40
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        : 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        color,
      )}
    >
      {probability}%
    </span>
  )
}
