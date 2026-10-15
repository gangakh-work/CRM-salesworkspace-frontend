import { apiClient } from '@/infrastructure/api/client'

const DASHBOARD_BASE = '/dashboard'

export interface DashboardKpisData {
  total_leads: number
  open_opportunities: number
  won_opportunities: number
  lost_opportunities: number
  pipeline_value: number
  this_month_revenue: number
  qualified_leads: number
  conversion_rate: number
}

export interface DashboardRefreshMeta {
  refreshed_at: string
  source: string
}

export interface ChartDataPoint {
  label: string
  value: number
  count: number
}

export interface RevenueTrendPoint {
  label: string
  month: string
  revenue: number
}

export interface OpportunityPipelineStage {
  stage: string
  label: string
  count: number
  value: number
}

export interface RecentLeadRow {
  id: string
  name: string
  company: string
  status: string
  owner: string
  created_on: string | null
}

export interface RecentOpportunityRow {
  id: string
  name: string
  stage: string
  value: number
  status: string
  owner: string
  modified_on: string | null
}

export interface UpcomingActivityRow {
  id: string
  subject: string
  regarding: string
  scheduled_start: string | null
  scheduled_end: string | null
  status: string
}

export interface AiRecommendationRow {
  id: string
  lead_id: string
  lead_name: string
  title: string
  description: string
  priority: string
  category: string
  action_label: string
}

export type ExecutiveRole = 'ceo' | 'sales_head' | 'manager' | 'sales_executive'

export interface ExecutiveKpisData {
  revenue: number
  revenue_mtd: number
  revenue_trend_pct: number
  forecast: number
  pipeline: number
  win_rate: number
  average_deal_size: number
  open_deals: number
  won_deals: number
  lost_deals: number
  total_leads: number
  qualified_leads: number
  conversion_rate: number
}

export interface TopSalespersonRow {
  rank: number
  name: string
  revenue: number
  pipeline: number
  deals_won: number
  deals_open: number
  win_rate: number
}

export interface TopOpportunityRow {
  rank: number
  id: string
  name: string
  value: number
  stage: string
  owner: string
  probability: number
  status: string
}

export interface ExecutiveTrendPoint {
  label: string
  period: string
  revenue: number
  pipeline: number
  forecast: number
}

export interface ExecutiveDashboardData {
  role: ExecutiveRole
  scope: string
  owner_filter: string | null
  kpis: ExecutiveKpisData
  top_salespeople: TopSalespersonRow[]
  top_opportunities: TopOpportunityRow[]
  monthly_trends: ExecutiveTrendPoint[]
  quarterly_trends: ExecutiveTrendPoint[]
  pipeline_by_stage: OpportunityPipelineStage[]
}

interface ApiEnvelope<T> {
  data: T
  meta: DashboardRefreshMeta
}

function normalizeApiError(error: unknown): Error {
  const axiosError = error as {
    response?: { data?: { error?: { message?: string }; message?: string } }
    message?: string
  }
  const message =
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Dashboard request failed'
  return new Error(message)
}

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<ApiEnvelope<T>> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<T>>(`${DASHBOARD_BASE}${path}`, { params })
    return data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export const DashboardApi = {
  fetchKpis: () => get<DashboardKpisData>('/kpis'),
  fetchExecutiveDashboard: (role: ExecutiveRole, ownerName?: string) =>
    get<ExecutiveDashboardData>('/executive', {
      role,
      owner_name: ownerName,
    }),
  fetchOpportunityPipeline: () => get<OpportunityPipelineStage[]>('/charts/opportunity-pipeline'),
  fetchOpportunityByStage: () => get<ChartDataPoint[]>('/charts/opportunity-by-stage'),
  fetchRevenueTrend: () => get<RevenueTrendPoint[]>('/charts/revenue-trend'),
  fetchLeadsBySource: () => get<ChartDataPoint[]>('/charts/leads-by-source'),
  fetchLeadsByOwner: () => get<ChartDataPoint[]>('/charts/leads-by-owner'),
  fetchLeadsByStatus: () => get<ChartDataPoint[]>('/charts/leads-by-status'),
  fetchRecentLeads: () => get<RecentLeadRow[]>('/recent-leads'),
  fetchRecentOpportunities: () => get<RecentOpportunityRow[]>('/recent-opportunities'),
  fetchUpcomingActivities: () => get<UpcomingActivityRow[]>('/upcoming-activities'),
  fetchAiRecommendations: () => get<AiRecommendationRow[]>('/ai-recommendations'),
  fetchLeadFunnel: () => get<Record<string, number>>('/reports/lead-funnel'),
  fetchDisqualificationReport: () =>
    get<{
      total_disqualified: number
      top_reasons: { label: string; count: number }[]
      competitor_analysis: { label: string; count: number }[]
      industry_analysis: { label: string; count: number }[]
      source_analysis: { label: string; count: number }[]
    }>('/reports/disqualification'),
}
