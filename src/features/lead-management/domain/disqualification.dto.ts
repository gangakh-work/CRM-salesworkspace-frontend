import type { DisqualifyLeadInput } from '@/features/lead-management/domain/disqualification.schema'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type { Lead, LeadDisqualificationData, LeadExtras } from '@/features/lead-management/types/lead.types'

export type DisqualifyLeadDto = DisqualifyLeadInput

export interface DisqualifyLeadResultDto {
  lead: Lead
  extras: LeadExtras
  activity: StoredActivity
  disqualification: LeadDisqualificationData
}
