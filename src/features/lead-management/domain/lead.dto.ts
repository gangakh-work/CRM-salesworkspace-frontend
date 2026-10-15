import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'

/** Input DTO for lead creation — validated by Zod schema before service layer. */
export type CreateLeadDto = CreateLeadInput

/** Output DTO returned after successful lead creation. */
export interface CreateLeadResultDto {
  lead: Lead
  extras: LeadExtras
  activity: StoredActivity
  crmUrl?: string
}

/** Request payload sent to API repository (includes owner assignment). */
export interface CreateLeadRequestDto {
  input: CreateLeadDto
  owner: string
}

/** Snapshot DTO for repository load operations. */
export interface LeadStoreDto {
  leads: Lead[]
  leadExtras: Record<string, LeadExtras>
  activities: StoredActivity[]
}
