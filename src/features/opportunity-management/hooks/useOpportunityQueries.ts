import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'

import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import type { CreateOpportunityPayload } from '@/features/opportunity-management/api/OpportunityApi'
import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'
import { queryKeys } from '@/infrastructure/api/query-keys'

export type OpportunityDetailCache = {
  opportunity: Opportunity
  extras: OpportunityExtras
}

/** Update opportunity detail + list caches after a mutation. */
export function syncOpportunityDetailCache(
  queryClient: ReturnType<typeof useQueryClient>,
  opportunity: Opportunity,
  extras?: OpportunityExtras,
) {
  queryClient.setQueryData(
    queryKeys.opportunities.detail(opportunity.id),
    (current: OpportunityDetailCache | undefined) =>
      current
        ? { ...current, opportunity, extras: extras ?? current.extras }
        : extras
          ? { opportunity, extras }
          : current,
  )
}

export function mergeOpportunitiesWithServer(local: Opportunity[], server: Opportunity[]): Opportunity[] {
  const serverIds = new Set(server.map((item) => item.id))
  const pendingLocal = local.filter((item) => !serverIds.has(item.id))
  return [...pendingLocal, ...server]
}

export function useOpportunitiesQuery() {
  return useQuery({
    queryKey: queryKeys.opportunities.list(),
    queryFn: () => OpportunityApi.fetchOpportunities(),
    staleTime: 30_000,
  })
}

export function useOpportunityDetailQuery(opportunityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.opportunities.detail(opportunityId ?? ''),
    queryFn: () => OpportunityApi.fetchOpportunityById(opportunityId!),
    enabled: Boolean(opportunityId),
    staleTime: 30_000,
  })
}

export function useCreateOpportunity(options: { showToast?: boolean } = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => OpportunityApi.createOpportunity(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(
        queryKeys.opportunities.list(),
        (current: { opportunities: Opportunity[]; opportunityExtras: Record<string, OpportunityExtras> } | undefined) => {
          if (!current) {
            return {
              opportunities: [result.opportunity],
              opportunityExtras: { [result.opportunity.id]: result.extras },
            }
          }
          if (current.opportunities.some((item) => item.id === result.opportunity.id)) return current
          return {
            opportunities: [result.opportunity, ...current.opportunities],
            opportunityExtras: { ...current.opportunityExtras, [result.opportunity.id]: result.extras },
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      if (showToast) {
        sonnerToast.success('Opportunity created', { description: result.opportunity.name })
      }
    },
    onError: (error: Error) => {
      if (showToast) sonnerToast.error('Failed to create opportunity', { description: error.message })
    },
  })
}

export function useUpdateOpportunity(options: { showToast?: boolean } = {}) {
  const { showToast = false } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (opportunity: Opportunity) => OpportunityApi.updateOpportunityFromModel(opportunity),
    onSuccess: (opportunity) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      queryClient.setQueryData(
        queryKeys.opportunities.detail(opportunity.id),
        (current: { opportunity: Opportunity } | undefined) =>
          current ? { ...current, opportunity } : current,
      )
      if (showToast) sonnerToast.success('Opportunity updated', { description: opportunity.name })
    },
    onError: (error: Error) => {
      if (showToast) sonnerToast.error('Failed to update opportunity', { description: error.message })
    },
  })
}

export function useStageDistributionQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.stageDistribution(),
    queryFn: async () => {
      const { opportunities } = await OpportunityApi.fetchOpportunities()
      const { forecastEngineService } = await import(
        '@/features/opportunity-management/services/forecast-engine.service'
      )
      return forecastEngineService.getStageDistribution(opportunities)
    },
    staleTime: 30_000,
  })
}

export function useForecastMetricsQuery() {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'forecast-metrics'] as const,
    queryFn: async () => {
      const { opportunities } = await OpportunityApi.fetchOpportunities()
      const { forecastEngineService } = await import(
        '@/features/opportunity-management/services/forecast-engine.service'
      )
      return forecastEngineService.computeForecastMetrics(opportunities)
    },
    staleTime: 30_000,
  })
}

export function useLostAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.lostAnalytics(),
    queryFn: () =>
      import('@/features/opportunity-management/services/opportunity-lost.service').then((m) =>
        m.opportunityLostService.getLostAnalytics(),
      ),
    staleTime: 30_000,
  })
}
