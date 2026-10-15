import type { CloseAsLostInput } from '@/features/opportunity-management/domain/lost.schema'
import { ownerOptions } from '@/features/crm-workspace/lib/crm-filter-defaults'
import type { LostReason, Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export const LOST_FORM_STEPS = [
  'Reason',
  'Competitor Details',
  'Future Opportunity',
  'Review',
] as const

export const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: 'price_too_high', label: 'Price Too High' },
  { value: 'lost_to_competitor', label: 'Lost to Competitor' },
  { value: 'budget_cancelled', label: 'Budget Cancelled' },
  { value: 'project_cancelled', label: 'Project Cancelled' },
  { value: 'no_decision', label: 'No Decision' },
  { value: 'not_interested', label: 'Customer Not Interested' },
  { value: 'technical_mismatch', label: 'Technical Mismatch' },
  { value: 'timeline_changed', label: 'Timeline Changed' },
  { value: 'internal_decision', label: 'Internal Decision' },
  { value: 'other', label: 'Other' },
]

export function buildFollowUpOwnerOptions(owners: string[]) {
  return ownerOptions(owners)
}

function defaultFollowUpDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().slice(0, 10)
}

export function getLostReasonLabel(reason: LostReason): string {
  return LOST_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason
}

export function createLostDefaultValues(opp?: Opportunity): CloseAsLostInput {
  return {
    lostReason: 'no_decision',
    competitorName: '',
    competitorSolution: '',
    priceDifference: '',
    lostRemarks: '',
    willRevisit: 'no',
    followUpDate: defaultFollowUpDate(),
    followUpOwner: opp?.owner ?? '',
    confirmed: false,
  }
}

export function buildLostSummary(input: CloseAsLostInput): string {
  const reason = getLostReasonLabel(input.lostReason)
  const revisit = input.willRevisit === 'yes' ? ' · Revisit planned' : ''
  return `${reason}${revisit}`
}
