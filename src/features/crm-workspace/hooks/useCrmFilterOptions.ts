import { useQuery } from '@tanstack/react-query'

import { WorkspaceApi } from '@/features/crm-workspace/api/WorkspaceApi'
import { queryKeys } from '@/infrastructure/api/query-keys'

export function useCrmFilterOptions() {
  return useQuery({
    queryKey: queryKeys.crm.filterOptions(),
    queryFn: () => WorkspaceApi.fetchFilterOptions(),
    staleTime: 60_000,
  })
}
