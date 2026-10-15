import type { ConvertLeadInput } from '@/features/lead-management/domain/conversion.schema'
import {
  DEFAULT_CRM_INDUSTRIES,
  DEFAULT_CRM_REGIONS,
} from '@/features/crm-workspace/lib/crm-filter-defaults'
import type { Lead, LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { ForecastCategory, OpportunityStage } from '@/features/opportunity-management/types/opportunity.types'

export const CONVERSION_FORM_STEPS = [
  'Opportunity Basics',
  'Opportunity Details',
  'Commercial Details',
  'Review',
] as const

/** Only qualified leads can be converted to an opportunity. */
export const CONVERT_ELIGIBLE_STATUSES: LeadWorkflowStatus[] = ['qualified']

export const BUSINESS_UNITS = [
  'Commercial Sales',
  'Enterprise Sales',
  'Mid-Market',
  'Strategic Accounts',
] as const

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
] as const

export const STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = [
  'prospect',
  'qualification',
  'discovery',
  'proposal',
  'commercial_review',
  'negotiation',
  'legal_review',
].map((stage) => ({
  value: stage as OpportunityStage,
  label: formatStage(stage as OpportunityStage),
}))

export const FORECAST_OPTIONS: { value: ForecastCategory; label: string }[] = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'best_case', label: 'Best Case' },
  { value: 'commit', label: 'Commit' },
  { value: 'omitted', label: 'Omitted' },
]

export const PRIORITY_OPTIONS = [
  { value: 'high' as const, label: 'High' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'low' as const, label: 'Low' },
]

export function buildRegionOptions(regions: string[] = [...DEFAULT_CRM_REGIONS]) {
  return regions.map((r) => ({ value: r, label: r }))
}

export function buildIndustryOptions(industries: string[] = [...DEFAULT_CRM_INDUSTRIES]) {
  return industries.map((i) => ({ value: i, label: i }))
}

export const REGION_OPTIONS = buildRegionOptions()
export const INDUSTRY_OPTIONS = buildIndustryOptions()

function defaultCloseDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d.toISOString().slice(0, 10)
}

function mapCountryToRegion(country: string, regions: string[] = [...DEFAULT_CRM_REGIONS]): string {
  const map: Record<string, string> = {
    USA: 'North America',
    'United States': 'North America',
    Canada: 'North America',
    UK: 'EMEA',
    Germany: 'EMEA',
    France: 'EMEA',
    India: 'APAC',
    Australia: 'APAC',
    Japan: 'APAC',
  }
  return map[country] ?? regions[0] ?? 'North America'
}

export function createConvertDefaultValues(lead?: Lead): ConvertLeadInput {
  const revenue = lead?.expectedRevenue ?? lead?.budget ?? 100_000
  return {
    opportunityName: lead ? `${lead.company} — Enterprise Deal` : '',
    customer: lead?.company ?? '',
    primaryContact: lead?.name ?? '',
    expectedRevenue: String(revenue),
    estimatedCloseDate: lead?.nextFollowUp && lead.nextFollowUp !== '—'
      ? lead.nextFollowUp
      : defaultCloseDate(),
    salesStage: 'qualification',
    forecastCategory: 'pipeline',
    probability: '25',
    region: lead ? mapCountryToRegion(lead.country) : 'North America',
    businessUnit: 'Commercial Sales',
    industry: lead?.industry ?? DEFAULT_CRM_INDUSTRIES[0] ?? 'Technology',
    currency: 'USD',
    estimatedRevenue: String(revenue),
    expectedMargin: '32',
    priority: lead?.priority ?? 'medium',
    confirmed: false,
  }
}

export function formatForecastCategory(category: ForecastCategory): string {
  return FORECAST_OPTIONS.find((o) => o.value === category)?.label ?? category
}
