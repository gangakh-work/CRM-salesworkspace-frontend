import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'

export interface OpportunityStoreSnapshot {
  opportunities: Opportunity[]
  opportunityExtras: Record<string, OpportunityExtras>
}

export interface IOpportunityRepository {
  load(): Promise<OpportunityStoreSnapshot>
  replaceSnapshot(snapshot: OpportunityStoreSnapshot): Promise<void>
  saveOpportunity(opportunity: Opportunity, extras: OpportunityExtras): Promise<void>
  getCount(): Promise<number>
}
