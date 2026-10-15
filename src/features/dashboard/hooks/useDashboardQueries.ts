import { Mail, Target, UserPlus } from 'lucide-react'

import { DashboardApi } from '@/features/dashboard/api/DashboardApi'
import type { ActivityItem } from '@/features/dashboard/types/dashboard.types'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import type { LeadQualificationRating } from '@/features/lead-management/types/lead.types'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { formatRelativeTime } from '@/lib/formatters'
import { useQuery } from '@tanstack/react-query'

const ACTIVITY_ICONS = {
  lead: UserPlus,
  opportunity: Target,
  proposal: Target,
  meeting: Target,
  email: Mail,
} as const

const DASHBOARD_REFETCH_MS = 120_000

const dashboardQueryDefaults = {
  staleTime: 60_000,
  gcTime: 300_000,
  refetchInterval: DASHBOARD_REFETCH_MS,
  refetchOnWindowFocus: true,
} as const

export function useDashboardKpisQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: () => DashboardApi.fetchKpis(),
    ...dashboardQueryDefaults,
  })
}

export function useOpportunityPipelineChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.opportunityPipeline(),
    queryFn: () => DashboardApi.fetchOpportunityPipeline(),
    ...dashboardQueryDefaults,
  })
}

export function useOpportunityByStageChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.opportunityByStage(),
    queryFn: () => DashboardApi.fetchOpportunityByStage(),
    ...dashboardQueryDefaults,
  })
}

export function useRevenueTrendChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.revenueTrend(),
    queryFn: () => DashboardApi.fetchRevenueTrend(),
    ...dashboardQueryDefaults,
  })
}

export function useLeadsBySourceChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.leadsBySource(),
    queryFn: () => DashboardApi.fetchLeadsBySource(),
    ...dashboardQueryDefaults,
  })
}

export function useLeadsByOwnerChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.leadsByOwner(),
    queryFn: () => DashboardApi.fetchLeadsByOwner(),
    ...dashboardQueryDefaults,
  })
}

export function useLeadsByStatusChartQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.leadsByStatus(),
    queryFn: () => DashboardApi.fetchLeadsByStatus(),
    ...dashboardQueryDefaults,
  })
}

export function useRecentLeadsTableQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentLeads(),
    queryFn: () => DashboardApi.fetchRecentLeads(),
    ...dashboardQueryDefaults,
  })
}

export function useRecentOpportunitiesTableQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentOpportunities(),
    queryFn: () => DashboardApi.fetchRecentOpportunities(),
    ...dashboardQueryDefaults,
  })
}

export function useUpcomingActivitiesTableQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.upcomingActivities(),
    queryFn: () => DashboardApi.fetchUpcomingActivities(),
    ...dashboardQueryDefaults,
  })
}

export function useAiRecommendationsTableQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.aiRecommendations(),
    queryFn: () => DashboardApi.fetchAiRecommendations(),
    ...dashboardQueryDefaults,
  })
}

export function useLeadFunnelQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.funnel(),
    queryFn: async () => {
      const { data } = await DashboardApi.fetchLeadFunnel()
      return data
    },
    ...dashboardQueryDefaults,
  })
}

export function useDisqualificationReportQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.disqualificationReport(),
    queryFn: async () => {
      const { data } = await DashboardApi.fetchDisqualificationReport()
      return {
        totalDisqualified: data.total_disqualified,
        topReasons: data.top_reasons.map((r) => ({ label: r.label, count: r.count })),
        competitorAnalysis: data.competitor_analysis.map((r) => ({ name: r.label, count: r.count })),
        industryAnalysis: data.industry_analysis.map((r) => ({ name: r.label, count: r.count })),
        sourceAnalysis: data.source_analysis.map((r) => ({ name: r.label, count: r.count })),
      }
    },
    ...dashboardQueryDefaults,
  })
}

export function useLeadScoreDistributionQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.scoreDistribution(),
    queryFn: async (): Promise<Record<LeadQualificationRating, number>> => {
      const { leads } = await LeadApi.fetchLeads()
      const dist: Record<LeadQualificationRating, number> = { hot: 0, warm: 0, cold: 0 }
      for (const lead of leads) {
        if (lead.qualificationRating) {
          dist[lead.qualificationRating] += 1
        }
      }
      return dist
    },
    ...dashboardQueryDefaults,
  })
}

export function useRecentActivitiesQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.activities(),
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data } = await DashboardApi.fetchRecentLeads()
      return data.slice(0, 10).map((lead) => ({
        id: lead.id,
        title: `Lead: ${lead.name}`,
        description: `${lead.company} · ${lead.status}`,
        timestamp: lead.created_on ? formatRelativeTime(lead.created_on) : 'Recently',
        type: 'lead' as const,
        icon: ACTIVITY_ICONS.lead,
      }))
    },
    ...dashboardQueryDefaults,
  })
}

export { DASHBOARD_REFETCH_MS }
