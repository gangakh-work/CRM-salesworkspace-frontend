import type {
  Opportunity,
  OpportunityExtras,
  OpportunityLostAnalysis,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
} from '@/features/opportunity-management/types/opportunity.types'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'

export interface CloseOpportunityLostResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
  historyEntry: OpportunityStageHistoryEntry
  auditRecord: OpportunityStageAuditRecord
  activity: StoredActivity
  lostAnalysis: OpportunityLostAnalysis
}

export interface LostReasonCount {
  reason: string
  label: string
  count: number
}

export interface CompetitorAnalysisEntry {
  competitor: string
  count: number
  totalLostRevenue: number
}

export interface LostAnalyticsSummary {
  topLostReasons: LostReasonCount[]
  competitorAnalysis: CompetitorAnalysisEntry[]
  industryAnalysis: { industry: string; count: number; revenue: number }[]
  regionAnalysis: { region: string; count: number; revenue: number }[]
  averageLostDealSize: number
  totalLostRevenue: number
}
