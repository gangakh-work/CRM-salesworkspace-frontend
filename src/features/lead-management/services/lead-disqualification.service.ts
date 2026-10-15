import { formatDisqualificationReason } from '@/features/lead-management/config/disqualification-form.config'
import { DISQUALIFY_ELIGIBLE_STATUSES } from '@/features/lead-management/config/disqualification-form.config'
import type { DisqualifyLeadResultDto } from '@/features/lead-management/domain/disqualification.dto'
import {
  disqualifyLeadSchema,
  type DisqualifyLeadInput,
} from '@/features/lead-management/domain/disqualification.schema'
import {
  buildDisqualificationRecord,
  buildDisqualificationSummary,
} from '@/features/lead-management/lib/disqualification-record'
import { mapToDataverseDisqualifyReason } from '@/features/lead-management/lib/disqualify-reason-mapper'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'
import type {
  LeadActivity,
  LeadExtras,
  LeadTimelineEvent,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'

export class LeadDisqualificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadDisqualificationError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export function canDisqualifyLead(status: LeadWorkflowStatus): boolean {
  return DISQUALIFY_ELIGIBLE_STATUSES.includes(status)
}

export async function hasClosedOpportunityForLead(
  leadId: string,
  convertedOpportunityId?: string,
): Promise<boolean> {
  const { opportunities } = await OpportunityApi.fetchOpportunities()
  return opportunities.some(
    (o) =>
      (o.leadId === leadId || o.id === convertedOpportunityId) &&
      (o.status === 'won' || o.status === 'lost'),
  )
}

/** Lead disqualification — validates and persists via Dataverse DisqualifyLead action. */
export class LeadDisqualificationService {
  async canDisqualify(leadId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { lead: existing } = await LeadApi.fetchLeadById(leadId)
    if (!canDisqualifyLead(existing.status)) {
      return {
        allowed: false,
        reason: 'Only leads with status New, Contacted, or Qualified can be disqualified',
      }
    }
    const hasClosed = await hasClosedOpportunityForLead(
      existing.id,
      existing.convertedOpportunityId,
    )
    if (hasClosed) {
      return {
        allowed: false,
        reason: 'Leads linked to won or lost opportunities cannot be disqualified',
      }
    }
    return { allowed: true }
  }

  async disqualifyLead(
    leadId: string,
    input: DisqualifyLeadInput,
    disqualifiedBy: string,
  ): Promise<DisqualifyLeadResultDto> {
    const parsed = disqualifyLeadSchema.parse(input)
    const eligibility = await this.canDisqualify(leadId)
    if (!eligibility.allowed) {
      throw new LeadDisqualificationError(eligibility.reason ?? 'Lead cannot be disqualified')
    }

    const { lead: existing, extras: existingExtras } = await LeadApi.fetchLeadById(leadId)
    const disqualification = buildDisqualificationRecord(parsed, disqualifiedBy)
    const reasonLabel = formatDisqualificationReason(disqualification.reason)

    const commentParts = [
      reasonLabel,
      disqualification.remarks,
      disqualification.competitorName ? `Competitor: ${disqualification.competitorName}` : undefined,
    ].filter(Boolean)

    await LeadApi.disqualifyLead(
      leadId,
      mapToDataverseDisqualifyReason(disqualification.reason),
      commentParts.join(' — '),
    )

    const { lead: refreshed, extras: refreshedExtras } = await LeadApi.fetchLeadById(leadId)
    const today = disqualification.disqualifiedAt

    const timelineEvents: LeadTimelineEvent[] = [
      {
        id: nextId('evt'),
        type: 'disqualified',
        title: 'Lead Disqualified',
        description: `${existing.name} was disqualified from the pipeline.`,
        timestamp: new Date().toISOString(),
        actor: disqualifiedBy,
        metadata: { reason: disqualification.reason },
      },
      {
        id: nextId('evt'),
        type: 'disqualification_reason',
        title: 'Reason Recorded',
        description: reasonLabel + (disqualification.remarks ? ` — ${disqualification.remarks}` : ''),
        timestamp: new Date().toISOString(),
        actor: disqualifiedBy,
        metadata: {
          reason: disqualification.reason,
          competitor: disqualification.competitorName ?? '',
        },
      },
    ]

    const followUpActivities: LeadActivity[] = []
    if (disqualification.scheduleFollowUp && disqualification.followUpDate) {
      timelineEvents.push({
        id: nextId('evt'),
        type: 'follow_up_scheduled',
        title: 'Future Follow-up Created',
        description: `Revisit scheduled in ${disqualification.revisitAfterDays} days — assigned to ${disqualification.followUpOwner}.`,
        timestamp: new Date().toISOString(),
        actor: disqualifiedBy,
        metadata: {
          followUpDate: disqualification.followUpDate,
          owner: disqualification.followUpOwner ?? '',
        },
      })
      followUpActivities.push({
        id: nextId('act'),
        type: 'task',
        subject: `Revisit disqualified lead: ${existing.company}`,
        description: `Follow up after disqualification (${reasonLabel}).`,
        status: 'planned',
        dueDate: disqualification.followUpDate,
        owner: disqualification.followUpOwner ?? disqualifiedBy,
        createdAt: today,
      })
    }

    const updatedExtras: LeadExtras = {
      ...refreshedExtras,
      ...existingExtras,
      disqualification,
      timeline: [...timelineEvents, ...(refreshedExtras.timeline ?? existingExtras.timeline ?? [])],
      activities: [...followUpActivities, ...(refreshedExtras.activities ?? existingExtras.activities ?? [])],
    }

    const activity: StoredActivity = {
      id: nextId('activity'),
      title: 'Lead Disqualified',
      description: `${existing.name} — ${existing.company} · ${buildDisqualificationSummary(disqualification)}`,
      timestamp: 'Just now',
      isoTimestamp: new Date().toISOString(),
      type: 'lead',
      entityId: leadId,
      entityType: 'lead',
    }

    return {
      lead: { ...refreshed, disqualifiedDate: today, disqualifiedBy, disqualificationReason: disqualification.reason },
      extras: updatedExtras,
      activity,
      disqualification,
    }
  }
}

export const leadDisqualificationService = new LeadDisqualificationService()
