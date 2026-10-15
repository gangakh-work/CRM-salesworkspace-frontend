import type { QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import type { LeadPriority, LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'

/** Wizard step labels. */
export const QUALIFICATION_FORM_STEPS = [
  'Customer Interest',
  'Budget',
  'Qualification Questions',
  'Review',
] as const

/** Statuses eligible for qualification (New = draft, Contacted = contacted). */
export const QUALIFY_ELIGIBLE_STATUSES: LeadWorkflowStatus[] = ['draft', 'assigned', 'contacted']

export const PRODUCT_OPTIONS = [
  'Enterprise Platform',
  'Cloud Migration',
  'Analytics Suite',
  'Security Package',
  'CRM Module',
  'AI Copilot',
  'Professional Services',
  'Other',
] as const

export const BUDGET_RANGE_OPTIONS = [
  { value: 'under-25k', label: 'Under $25K' },
  { value: '25k-100k', label: '$25K – $100K' },
  { value: '100k-500k', label: '$100K – $500K' },
  { value: '500k-1m', label: '$500K – $1M' },
  { value: 'over-1m', label: 'Over $1M' },
] as const

export const BUYING_TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (< 30 days)' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'half-year', label: 'Next 6 Months' },
  { value: 'year', label: 'Within 12 Months' },
  { value: 'exploring', label: 'Exploring / No Timeline' },
] as const

export const YES_NO_OPTIONS = [
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
]

export const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function createQualifyDefaultValues(lead?: {
  expectedRevenue?: number
  priority?: LeadPriority
}): QualifyLeadInput {
  return {
    productsInterested: '',
    expectedRevenue: lead?.expectedRevenue ? String(lead.expectedRevenue) : '',
    priority: lead?.priority ?? 'medium',
    budgetRange: '',
    buyingTimeline: '',
    decisionMaker: '',
    competitors: '',
    needConfirmed: 'no',
    budgetConfirmed: 'no',
    authorityConfirmed: 'no',
    timelineConfirmed: 'no',
    painPoints: '',
  }
}
