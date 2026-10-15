import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { ListSkeleton } from '@/components/patterns/skeletons'
import { Typography } from '@/components/ui/typography'
import { formatQualificationRating } from '@/features/lead-management/config/qualification-scoring.config'
import type { LeadQualificationRating } from '@/features/lead-management/types/lead.types'
import { useLeadScoreDistributionQuery } from '@/features/dashboard/hooks/useDashboardQueries'
import { cn } from '@/lib/utils'

const RATING_COLORS: Record<LeadQualificationRating, string> = {
  hot: 'bg-red-500',
  warm: 'bg-amber-500',
  cold: 'bg-sky-500',
}

export function LeadScoreDistributionPanel() {
  const { data, isLoading, isError, error, refetch } = useLeadScoreDistributionQuery()

  const total = data ? data.hot + data.warm + data.cold : 0

  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      loadingFallback={<ListSkeleton count={3} />}
      errorTitle="Unable to load score distribution"
    >
      {total === 0 ? (
        <Typography variant="caption" tone="muted" className="py-6 text-center">
          No qualified leads with scores yet. Qualify a lead to see distribution.
        </Typography>
      ) : (
        <div className="space-y-3">
          {(['hot', 'warm', 'cold'] as LeadQualificationRating[]).map((rating) => {
            const count = data![rating]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={rating}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{formatQualificationRating(rating)}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', RATING_COLORS[rating])}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${formatQualificationRating(rating)} leads`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AsyncBoundary>
  )
}
