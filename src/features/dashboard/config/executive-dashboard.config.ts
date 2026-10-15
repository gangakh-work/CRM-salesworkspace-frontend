export type ExecutiveRole = 'ceo' | 'sales_head' | 'manager' | 'sales_executive'

export type ExecutiveKpiKey =
  | 'revenue'
  | 'revenue_mtd'
  | 'forecast'
  | 'pipeline'
  | 'win_rate'
  | 'average_deal_size'
  | 'open_deals'
  | 'won_deals'
  | 'total_leads'
  | 'conversion_rate'

export interface ExecutiveRoleConfig {
  id: ExecutiveRole
  label: string
  description: string
  kpis: ExecutiveKpiKey[]
  showTopSalespeople: boolean
  showTopOpportunities: boolean
  showMonthlyTrends: boolean
  showQuarterlyTrends: boolean
  showPipelineByStage: boolean
  scopeLabel: string
}

export const EXECUTIVE_ROLE_CONFIG: Record<ExecutiveRole, ExecutiveRoleConfig> = {
  ceo: {
    id: 'ceo',
    label: 'CEO',
    description: 'Organization-wide revenue, forecast, and pipeline health',
    kpis: ['revenue', 'forecast', 'pipeline', 'win_rate', 'average_deal_size', 'revenue_mtd'],
    showTopSalespeople: true,
    showTopOpportunities: true,
    showMonthlyTrends: true,
    showQuarterlyTrends: true,
    showPipelineByStage: true,
    scopeLabel: 'Organization',
  },
  sales_head: {
    id: 'sales_head',
    label: 'Sales Head',
    description: 'Full sales performance, team leaderboard, and deal pipeline',
    kpis: ['revenue', 'forecast', 'pipeline', 'win_rate', 'average_deal_size', 'open_deals'],
    showTopSalespeople: true,
    showTopOpportunities: true,
    showMonthlyTrends: true,
    showQuarterlyTrends: true,
    showPipelineByStage: true,
    scopeLabel: 'Sales Organization',
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    description: 'Team pipeline, win rate, and top performers',
    kpis: ['pipeline', 'forecast', 'win_rate', 'average_deal_size', 'open_deals', 'won_deals'],
    showTopSalespeople: true,
    showTopOpportunities: true,
    showMonthlyTrends: true,
    showQuarterlyTrends: false,
    showPipelineByStage: true,
    scopeLabel: 'Team',
  },
  sales_executive: {
    id: 'sales_executive',
    label: 'Sales Executive',
    description: 'Personal pipeline, forecast, and active deals',
    kpis: ['pipeline', 'forecast', 'win_rate', 'average_deal_size', 'revenue_mtd', 'open_deals'],
    showTopSalespeople: false,
    showTopOpportunities: true,
    showMonthlyTrends: true,
    showQuarterlyTrends: false,
    showPipelineByStage: true,
    scopeLabel: 'My Portfolio',
  },
}

export const EXECUTIVE_ROLES = Object.values(EXECUTIVE_ROLE_CONFIG)

export function mapUserRoleToExecutive(userRole: string): ExecutiveRole {
  const normalized = userRole.toLowerCase()
  if (normalized.includes('ceo')) return 'ceo'
  if (normalized.includes('head') || normalized.includes('director')) return 'sales_head'
  if (normalized.includes('manager')) return 'manager'
  return 'sales_executive'
}

export const KPI_META: Record<
  ExecutiveKpiKey,
  { title: string; format: 'currency' | 'percent' | 'number'; accent: string }
> = {
  revenue: { title: 'Total Revenue', format: 'currency', accent: 'border-l-emerald-500' },
  revenue_mtd: { title: 'Revenue MTD', format: 'currency', accent: 'border-l-teal-500' },
  forecast: { title: 'Weighted Forecast', format: 'currency', accent: 'border-l-violet-500' },
  pipeline: { title: 'Pipeline Value', format: 'currency', accent: 'border-l-blue-500' },
  win_rate: { title: 'Win Rate', format: 'percent', accent: 'border-l-amber-500' },
  average_deal_size: { title: 'Avg Deal Size', format: 'currency', accent: 'border-l-orange-500' },
  open_deals: { title: 'Open Deals', format: 'number', accent: 'border-l-sky-500' },
  won_deals: { title: 'Won Deals', format: 'number', accent: 'border-l-green-500' },
  total_leads: { title: 'Total Leads', format: 'number', accent: 'border-l-indigo-500' },
  conversion_rate: { title: 'Lead Conversion', format: 'percent', accent: 'border-l-pink-500' },
}
