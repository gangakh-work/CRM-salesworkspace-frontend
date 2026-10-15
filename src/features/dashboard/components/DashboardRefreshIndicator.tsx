import { RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { DASHBOARD_REFETCH_MS, useDashboardKpisQuery } from '@/features/dashboard/hooks/useDashboardQueries'

export function DashboardRefreshIndicator() {
  const { data, isFetching } = useDashboardKpisQuery()
  const refreshedAt = data?.meta.refreshed_at

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="gap-1.5 font-normal">
        <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        Auto refresh every {DASHBOARD_REFETCH_MS / 1000}s
      </Badge>
      {refreshedAt && (
        <Typography variant="caption" tone="muted">
          Last updated {formatDistanceToNow(new Date(refreshedAt), { addSuffix: true })}
        </Typography>
      )}
    </div>
  )
}
