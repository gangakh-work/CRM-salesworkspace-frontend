import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { OpportunityStageHistoryEntry } from '@/features/opportunity-management/types/opportunity.types'
import { Typography } from '@/components/ui/typography'
import { StageBadge } from '@/features/opportunity-management/components/OpportunityBadges'

export function OpportunityStageHistoryPanel({
  history,
}: {
  history: OpportunityStageHistoryEntry[]
}) {
  if (history.length === 0) {
    return (
      <Typography variant="caption" tone="muted">
        No stage transitions recorded yet.
      </Typography>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="rounded-xl border border-border/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={entry.fromStage} />
            <span className="text-muted-foreground">→</span>
            <StageBadge stage={entry.toStage} />
          </div>
          <Typography variant="caption" tone="muted" className="mt-2 block">
            {new Date(entry.transitionedAt).toLocaleString()} · {entry.transitionedBy}
          </Typography>
          {entry.notes && (
            <Typography variant="body" className="mt-2 text-sm">
              {entry.notes}
            </Typography>
          )}
        </div>
      ))}
    </div>
  )
}

export function formatPreviousStage(stage: string | undefined) {
  if (!stage) return '—'
  return formatStage(stage as Parameters<typeof formatStage>[0])
}
