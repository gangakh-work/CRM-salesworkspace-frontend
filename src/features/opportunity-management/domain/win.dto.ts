import type {
  Opportunity,
  OpportunityExtras,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
} from '@/features/opportunity-management/types/opportunity.types'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'

export interface CloseOpportunityWonResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
  historyEntry: OpportunityStageHistoryEntry
  auditRecord: OpportunityStageAuditRecord
  activity: StoredActivity
}
