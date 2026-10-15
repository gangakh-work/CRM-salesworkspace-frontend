import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'

/** Wizard step labels — order defines navigation sequence. */
export const LEAD_FORM_STEPS = [
  'Customer',
  'Company',
  'Opportunity',
  'Additional',
  'Review',
] as const

export type LeadFormStep = (typeof LEAD_FORM_STEPS)[number]

export const LEAD_INDUSTRY_OPTIONS = [
  'Technology',
  'Manufacturing',
  'Retail',
  'Financial Services',
  'Healthcare',
  'Logistics',
  'Hospitality',
  'Utilities',
  'Media',
  'Travel',
  'Creative',
  'Research',
  'Other',
] as const

export const LEAD_COUNTRY_OPTIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Australia',
  'India',
  'Japan',
  'Singapore',
  'Netherlands',
  'Other',
] as const

export const LEAD_SOURCE_OPTIONS = [
  'Website',
  'Referral',
  'Trade Show',
  'LinkedIn',
  'Cold Call',
  'Partner',
  'Email Campaign',
  'Other',
] as const

export const LEAD_PRIORITY_OPTIONS = [
  { value: 'high' as const, label: 'High' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'low' as const, label: 'Low' },
]

/** Default empty form state for create-lead wizard. */
export const CREATE_LEAD_DEFAULT_VALUES: CreateLeadInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  companyName: '',
  industry: '',
  country: '',
  website: '',
  employees: '',
  opportunityName: '',
  expectedRevenue: '',
  budget: '',
  closeDate: '',
  source: '',
  priority: 'medium',
  description: '',
  notes: '',
}
