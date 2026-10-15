import { BUSINESS_UNITS, CURRENCY_OPTIONS } from '@/features/lead-management/config/conversion-form.config'
import type { CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import { ownerOptions } from '@/features/crm-workspace/lib/crm-filter-defaults'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export const WIN_FORM_STEPS = [
  'Final Revenue',
  'Customer Information',
  'Implementation Details',
  'Review',
] as const

export { BUSINESS_UNITS, CURRENCY_OPTIONS }

export function buildDeliveryOwnerOptions(owners: string[]) {
  return ownerOptions(owners)
}

export const BUSINESS_UNIT_OPTIONS = BUSINESS_UNITS.map((u) => ({ value: u, label: u }))

function defaultContractEnd(start: string): string {
  const d = new Date(start)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function defaultKickoff(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

export function createWinDefaultValues(opp?: Opportunity): CloseAsWonInput {
  const revenue = opp?.expectedRevenue ?? 100_000
  const marginPct = opp?.finalMargin
    ? String(Math.round((opp.finalMargin / revenue) * 100))
    : '32'
  const today = new Date().toISOString().slice(0, 10)

  return {
    finalRevenue: String(revenue),
    currency: opp?.currency ?? 'USD',
    contractValue: String(revenue),
    margin: marginPct,
    discount: '5',
    decisionMaker: opp?.primaryContact ?? '',
    contractStartDate: today,
    contractEndDate: defaultContractEnd(today),
    expectedKickoff: defaultKickoff(),
    deliveryOwner: opp?.owner ?? '',
    businessUnit: opp?.businessUnit ?? 'Commercial Sales',
    confirmed: false,
  }
}

export function buildWinSummary(input: CloseAsWonInput): string {
  const revenue = Number(input.finalRevenue)
  const margin = Number(input.margin)
  return `${input.currency} ${revenue.toLocaleString()} · ${margin}% margin · ${input.businessUnit}`
}
