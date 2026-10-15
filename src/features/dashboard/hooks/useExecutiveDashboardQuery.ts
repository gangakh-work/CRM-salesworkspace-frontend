import { useQuery } from '@tanstack/react-query'

import { DashboardApi, type ExecutiveRole } from '@/features/dashboard/api/DashboardApi'
import { DASHBOARD_REFETCH_MS } from '@/features/dashboard/hooks/useDashboardQueries'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function useExecutiveDashboardQuery(role: ExecutiveRole, ownerName?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.executive(role, ownerName),
    queryFn: () => DashboardApi.fetchExecutiveDashboard(role, ownerName),
    staleTime: 30_000,
    refetchInterval: DASHBOARD_REFETCH_MS,
    refetchIntervalInBackground: true,
  })
}
