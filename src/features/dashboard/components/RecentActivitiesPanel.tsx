import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { ListSkeleton } from '@/components/patterns/skeletons'
import { Timeline } from '@/components/patterns/data-display'
import { Typography } from '@/components/ui/typography'
import { useRecentActivitiesQuery } from '@/features/dashboard/hooks/useDashboardQueries'

export function RecentActivitiesPanel() {
  const { data: activities, isLoading, isError, error, refetch } = useRecentActivitiesQuery()

  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      loadingFallback={<ListSkeleton />}
      errorTitle="Unable to load recent activities"
    >
      {!activities?.length ? (
        <Typography variant="caption" tone="muted" className="py-8 text-center">
          No recent activities yet. Create a lead to get started.
        </Typography>
      ) : (
        <Timeline
          items={activities.map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            timestamp: activity.timestamp,
            icon: activity.icon,
          }))}
        />
      )}
    </AsyncBoundary>
  )
}
