import { useQuery } from '@tanstack/react-query'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { DashboardApi } from '@/features/dashboard/api/DashboardApi'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function UpcomingMeetingsPanel() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.upcomingActivities(),
    queryFn: () => DashboardApi.fetchUpcomingActivities(),
    staleTime: 60_000,
  })

  const meetings = query.data?.data ?? []

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Typography variant="caption" tone="muted">Loading meetings...</Typography>}
      errorTitle="Unable to load upcoming activities"
    >
      <div className="mb-4 flex items-center justify-between">
        <Typography variant="caption" tone="muted">
          {meetings.length} upcoming activit{meetings.length === 1 ? 'y' : 'ies'}
        </Typography>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No upcoming activities are scheduled.</div>
      ) : meetings.map((meeting, index) => {
        const start = meeting.scheduled_start?.slice(0, 16) ?? 'TBD'
        return (
          <div
            key={meeting.id}
            className="flex items-start gap-3 border-b border-border/40 py-3 last:border-0"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="body" className="truncate text-sm font-medium">
                {meeting.subject}
              </Typography>
              <Typography variant="caption" tone="muted">
                {meeting.regarding} · {start}
              </Typography>
            </div>
          </div>
        )
      })}
    </AsyncBoundary>
  )
}
