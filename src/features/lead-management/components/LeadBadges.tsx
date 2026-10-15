import { Badge } from '@/components/ui/badge'
import { formatDisqualificationReason } from '@/features/lead-management/config/disqualification-form.config'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import type {
  DisqualificationReason,
  LeadQualificationRating,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import { cn } from '@/lib/utils'

export { PriorityBadge } from '@/components/patterns/PriorityBadge'

const scoreColor = (score: number) => {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-muted text-muted-foreground'
}

export function LeadScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        scoreColor(score),
      )}
    >
      {score}
    </span>
  )
}

const STATUS_VARIANT: Record<LeadWorkflowStatus, 'success' | 'error' | 'info' | 'warning' | 'secondary' | 'neutral'> = {
  draft: 'neutral',
  assigned: 'secondary',
  contacted: 'info',
  qualified: 'success',
  proposal_sent: 'info',
  negotiation: 'warning',
  converted: 'success',
  disqualified: 'error',
}

export function StatusBadge({ status }: { status: LeadWorkflowStatus | string }) {
  const workflowStatus = status as LeadWorkflowStatus
  const variant = STATUS_VARIANT[workflowStatus] ?? 'secondary'
  const label = STATUS_VARIANT[workflowStatus] !== undefined
    ? formatWorkflowStatus(workflowStatus)
    : String(status)

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  )
}

const RATING_VARIANT: Record<LeadQualificationRating, 'error' | 'warning' | 'info'> = {
  hot: 'error',
  warm: 'warning',
  cold: 'info',
}

export function QualificationRatingBadge({ rating }: { rating: LeadQualificationRating }) {
  return (
    <Badge variant={RATING_VARIANT[rating]} className="capitalize">
      {rating}
    </Badge>
  )
}

export function DisqualificationReasonBadge({ reason }: { reason: DisqualificationReason }) {
  return (
    <Badge variant="error" className="max-w-[12rem] truncate">
      {formatDisqualificationReason(reason)}
    </Badge>
  )
}
