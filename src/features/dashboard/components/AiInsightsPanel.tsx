import { useQuery } from '@tanstack/react-query'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { DashboardApi } from '@/features/dashboard/api/DashboardApi'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function AiInsightsPanel() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.aiRecommendations(),
    queryFn: () => DashboardApi.fetchAiRecommendations(),
    staleTime: 60_000,
  })

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Typography variant="caption" tone="muted">Loading AI insights...</Typography>}
      errorTitle="Unable to load AI insights"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {(query.data?.data ?? []).map((insight) => (
          <div key={insight.id} className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Typography variant="body" className="text-sm font-semibold">
              {insight.title}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-2 leading-relaxed">
              {insight.description}
            </Typography>
          </div>
        ))}
      </div>
    </AsyncBoundary>
  )
}
