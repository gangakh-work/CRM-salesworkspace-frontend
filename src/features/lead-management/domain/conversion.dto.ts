import type { LeadConversionData } from '@/features/lead-management/types/lead.types'
import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'

export interface ConvertLeadResultDto {
  lead: Lead
  extras: LeadExtras
  opportunity: Opportunity
  opportunityExtras: OpportunityExtras
  activity: StoredActivity
  conversion: LeadConversionData
}
