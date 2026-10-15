import type { ConvertLeadInput } from '@/features/lead-management/domain/conversion.schema'
import { stageToKanban } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { Lead, LeadConversionData } from '@/features/lead-management/types/lead.types'
import type { Opportunity, OpportunityPriority } from '@/features/opportunity-management/types/opportunity.types'

export function buildConversionRecord(
  input: ConvertLeadInput,
  opportunityId: string,
  convertedBy: string,
): LeadConversionData {
  const revenue = Number(input.estimatedRevenue)
  return {
    opportunityId,
    opportunityName: input.opportunityName.trim(),
    convertedAt: new Date().toISOString().slice(0, 10),
    convertedBy,
    expectedRevenue: revenue,
    salesStage: input.salesStage,
    region: input.region.trim(),
    businessUnit: input.businessUnit.trim(),
    currency: input.currency.trim(),
    expectedMargin: Number(input.expectedMargin),
  }
}

export function buildOpportunityFromConversion(
  input: ConvertLeadInput,
  lead: Lead,
  opportunityId: string,
): Opportunity {
  const revenue = Number(input.estimatedRevenue)
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: opportunityId,
    name: input.opportunityName.trim(),
    customer: input.customer.trim(),
    primaryContact: input.primaryContact.trim(),
    contactEmail: lead.email,
    owner: lead.owner,
    stage: input.salesStage,
    probability: Number(input.probability),
    expectedRevenue: revenue,
    forecastCategory: input.forecastCategory,
    closeDate: input.estimatedCloseDate,
    region: input.region.trim(),
    industry: input.industry.trim(),
    priority: input.priority as OpportunityPriority,
    risk: input.priority === 'high' ? 'medium' : 'low',
    status: 'open',
    lastActivity: today,
    kanbanColumn: stageToKanban(input.salesStage),
    currency: input.currency.trim(),
    description: lead.description ?? `Converted from lead ${lead.name} (${lead.company}). Business unit: ${input.businessUnit.trim()}.`,
    leadId: lead.id,
  }
}

export function buildConversionSummary(conversion: LeadConversionData): string {
  return `${conversion.opportunityName} · ${conversion.currency} ${conversion.expectedRevenue.toLocaleString()}`
}
