import type {
  Opportunity,
  OpportunityExtras,
  OpportunityStage,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
} from '@/features/opportunity-management/types/opportunity.types'

export interface TransitionStageResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
  fromStage: OpportunityStage
  toStage: OpportunityStage
  historyEntry: OpportunityStageHistoryEntry
  auditRecord: OpportunityStageAuditRecord
}

export interface AssignOwnerResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
  auditRecord: OpportunityStageAuditRecord
}

export interface OnHoldResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
  auditRecord: OpportunityStageAuditRecord
}

export interface DuplicateOpportunityResultDto {
  opportunity: Opportunity
  extras: OpportunityExtras
}
