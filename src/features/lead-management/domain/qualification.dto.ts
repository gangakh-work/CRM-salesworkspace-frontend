import type { QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type { Lead, LeadExtras, LeadQualificationData } from '@/features/lead-management/types/lead.types'

/** Input DTO for lead qualification wizard. */
export type QualifyLeadDto = QualifyLeadInput

/** Result DTO returned after successful qualification. */
export interface QualifyLeadResultDto {
  lead: Lead
  extras: LeadExtras
  activity: StoredActivity
  qualification: LeadQualificationData
}
