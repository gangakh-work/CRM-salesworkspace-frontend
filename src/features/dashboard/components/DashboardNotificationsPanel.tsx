import { useQuery } from '@tanstack/react-query'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { DashboardApi } from '@/features/dashboard/api/DashboardApi'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function DashboardNotificationsPanel() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.recentOpportunities(),
    queryFn: () => DashboardApi.fetchRecentOpportunities(),
    staleTime: 60_000,
  })

  const items = query.data?.data ?? []

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Typography variant="caption" tone="muted">Loading notifications...</Typography>}
      errorTitle="Unable to load recent activity"
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border/60 p-3">
            <Typography variant="body" className="text-sm font-medium">
              {item.name}
            </Typography>
            <Typography variant="caption" tone="muted">
              {item.stage} · {item.owner} · {item.status}
            </Typography>
          </li>
        ))}
      </ul>
    </AsyncBoundary>
  )
}
