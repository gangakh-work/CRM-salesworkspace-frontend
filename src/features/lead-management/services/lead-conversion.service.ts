import { CONVERT_ELIGIBLE_STATUSES } from '@/features/lead-management/config/conversion-form.config'
import type { ConvertLeadResultDto } from '@/features/lead-management/domain/conversion.dto'
import {
  convertLeadSchema,
  type ConvertLeadInput,
} from '@/features/lead-management/domain/conversion.schema'
import {
  buildConversionRecord,
  buildConversionSummary,
  buildOpportunityFromConversion,
} from '@/features/lead-management/lib/conversion-record'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type {
  Lead,
  LeadActivity,
  LeadExtras,
  LeadTimelineEvent,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  OpportunityActivity,
  OpportunityExtras,
  OpportunityTimelineEvent,
} from '@/features/opportunity-management/types/opportunity.types'

export class LeadConversionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadConversionError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export function canConvertLead(status: LeadWorkflowStatus, convertedOpportunityId?: string): boolean {
  if (convertedOpportunityId || status === 'converted') return false
  if (status === 'disqualified') return false
  return CONVERT_ELIGIBLE_STATUSES.includes(status)
}

function buildDefaultOpportunityExtras(opportunity: Awaited<ReturnType<typeof OpportunityApi.createOpportunity>>['opportunity']): OpportunityExtras {
  return {
    timeline: [],
    activities: [],
    contacts: [],
    notes: [],
    documents: [],
    meetings: [],
    emails: [],
    proposals: [],
    stageHistory: [],
    auditRecords: [],
    commercials: {
      revenue: opportunity.expectedRevenue,
      margin: 0,
      cost: opportunity.expectedRevenue,
      currency: opportunity.currency,
      forecast: opportunity.forecastCategory,
      discount: 0,
    },
  }
}

/** Converts a qualified lead into a Dataverse opportunity. */
export class LeadConversionService {
  async canConvert(leadId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { lead: existing } = await LeadApi.fetchLeadById(leadId)
    if (existing.status === 'disqualified') {
      return { allowed: false, reason: 'Disqualified leads cannot be converted' }
    }
    if (existing.status === 'converted' || existing.convertedOpportunityId) {
      return { allowed: false, reason: 'This lead has already been converted' }
    }
    // The Dataverse lead record does not carry the converted opportunity, so check
    // for an opportunity that originated from this lead (prevents a second conversion
    // creating a duplicate opportunity).
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    if (opportunities.some((o) => o.leadId === existing.id)) {
      return { allowed: false, reason: 'This lead has already been converted' }
    }
    if (!canConvertLead(existing.status, existing.convertedOpportunityId)) {
      return {
        allowed: false,
        reason: 'Only qualified leads can be converted to an opportunity',
      }
    }
    return { allowed: true }
  }

  async convertLead(
    leadId: string,
    input: ConvertLeadInput,
    convertedBy: string,
  ): Promise<ConvertLeadResultDto> {
    const parsed = convertLeadSchema.parse(input)
    const eligibility = await this.canConvert(leadId)
    if (!eligibility.allowed) {
      throw new LeadConversionError(eligibility.reason ?? 'Lead cannot be converted')
    }

    const { lead: existing, extras: existingExtras } = await LeadApi.fetchLeadById(leadId)
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()

    const draftOpportunity = buildOpportunityFromConversion(parsed, existing, 'pending')
    const { opportunity, extras: createdExtras } = await OpportunityApi.createOpportunity({
      name: draftOpportunity.name,
      customerName: draftOpportunity.customer,
      estimatedvalue: draftOpportunity.expectedRevenue,
      estimatedclosedate: draftOpportunity.closeDate,
      closeprobability: draftOpportunity.probability,
      description: draftOpportunity.description,
      stepname: draftOpportunity.stage,
      leadId,
      ownerName: convertedBy,
    })

    const opportunityId = opportunity.id
    const conversion = buildConversionRecord(parsed, opportunityId, convertedBy)

    const leadTimelineEvents: LeadTimelineEvent[] = [
      {
        id: nextId('evt'),
        type: 'converted',
        title: 'Lead Converted',
        description: `${existing.name} was converted to opportunity "${opportunity.name}".`,
        timestamp: now,
        actor: convertedBy,
        metadata: { opportunityId, opportunityName: opportunity.name },
      },
      {
        id: nextId('evt'),
        type: 'opportunity_created',
        title: 'Opportunity Created',
        description: `${opportunity.name} created with ${formatStage(opportunity.stage)} stage.`,
        timestamp: now,
        actor: convertedBy,
        metadata: { opportunityId },
      },
    ]

    const updatedLead: Lead = {
      ...existing,
      status: 'converted',
      convertedOpportunityId: opportunityId,
      convertedDate: today,
      convertedBy,
      opportunityName: opportunity.name,
      closeDate: opportunity.closeDate,
      expectedRevenue: opportunity.expectedRevenue,
      lastActivity: today,
    }

    const leadActivity: LeadActivity = {
      id: nextId('act'),
      type: 'task',
      subject: `Opportunity created: ${opportunity.name}`,
      description: buildConversionSummary(conversion),
      status: 'completed',
      owner: convertedBy,
      createdAt: today,
    }

    const updatedExtras: LeadExtras = {
      ...existingExtras,
      conversion,
      timeline: [...leadTimelineEvents, ...existingExtras.timeline],
      activities: [leadActivity, ...existingExtras.activities],
    }

    const oppTimelineEvents: OpportunityTimelineEvent[] = [
      {
        id: nextId('evt'),
        type: 'converted_from_lead',
        title: 'Converted from Lead',
        description: `Created from qualified lead ${existing.name} at ${existing.company}.`,
        timestamp: now,
        actor: convertedBy,
      },
      {
        id: nextId('evt'),
        type: 'created',
        title: 'Opportunity Created',
        description: `${opportunity.name} added to pipeline.`,
        timestamp: now,
        actor: convertedBy,
      },
    ]

    const oppActivity: OpportunityActivity = {
      id: nextId('act'),
      type: 'task',
      subject: `Lead conversion: ${existing.name}`,
      status: 'completed',
      owner: opportunity.owner,
      createdAt: today,
    }

    const marginAmount = Math.round(
      opportunity.expectedRevenue * (conversion.expectedMargin / 100),
    )
    const baseExtras = createdExtras ?? buildDefaultOpportunityExtras(opportunity)
    const opportunityExtras: OpportunityExtras = {
      ...baseExtras,
      timeline: [...oppTimelineEvents, ...baseExtras.timeline],
      activities: [oppActivity, ...baseExtras.activities],
      commercials: {
        ...baseExtras.commercials,
        revenue: opportunity.expectedRevenue,
        margin: marginAmount,
        cost: opportunity.expectedRevenue - marginAmount,
        currency: opportunity.currency,
        forecast: opportunity.forecastCategory,
      },
    }

    const storedActivity: StoredActivity = {
      id: nextId('activity'),
      title: 'Lead Converted to Opportunity',
      description: `${existing.name} · ${existing.company} → ${buildConversionSummary(conversion)}`,
      timestamp: 'Just now',
      isoTimestamp: now,
      type: 'opportunity',
      entityId: opportunityId,
      entityType: 'opportunity',
    }

    return {
      lead: updatedLead,
      extras: updatedExtras,
      opportunity,
      opportunityExtras,
      activity: storedActivity,
      conversion,
    }
  }
}

export const leadConversionService = new LeadConversionService()
