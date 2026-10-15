import type { DisqualifyLeadInput } from '@/features/lead-management/domain/disqualification.schema'
import { ownerOptions } from '@/features/crm-workspace/lib/crm-filter-defaults'
import type { DisqualificationReason, LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'

export const DISQUALIFICATION_FORM_STEPS = [
  'Reason',
  'Competitor',
  'Future Follow-up',
  'Review',
] as const

/** Statuses eligible for disqualification (New, Assigned, Contacted, Qualified). */
export const DISQUALIFY_ELIGIBLE_STATUSES: LeadWorkflowStatus[] = [
  'draft',
  'assigned',
  'contacted',
  'qualified',
]

export const DISQUALIFICATION_REASON_OPTIONS: {
  value: DisqualificationReason
  label: string
}[] = [
  { value: 'budget_constraints', label: 'Budget Constraints' },
  { value: 'no_business_need', label: 'No Business Need' },
  { value: 'lost_to_competitor', label: 'Lost to Competitor' },
  { value: 'duplicate_lead', label: 'Duplicate Lead' },
  { value: 'invalid_contact', label: 'Invalid Contact' },
  { value: 'no_response', label: 'No Response' },
  { value: 'project_cancelled', label: 'Project Cancelled' },
  { value: 'other', label: 'Other' },
]

export const REVISIT_AFTER_OPTIONS = [
  { value: '30' as const, label: '30 Days' },
  { value: '60' as const, label: '60 Days' },
  { value: '90' as const, label: '90 Days' },
  { value: '180' as const, label: '180 Days' },
]

export function buildFollowUpOwnerOptions(owners: string[]) {
  return ownerOptions(owners)
}

export function createDisqualifyDefaultValues(): DisqualifyLeadInput {
  return {
    reason: 'no_business_need',
    competitorName: '',
    remarks: '',
    scheduleFollowUp: false,
    revisitAfterDays: undefined,
    followUpOwner: '',
  }
}

export function formatDisqualificationReason(reason: DisqualificationReason): string {
  return DISQUALIFICATION_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason
}
