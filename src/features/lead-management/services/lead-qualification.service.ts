import { LeadApi } from '@/features/lead-management/api/LeadApi'
import { QUALIFY_ELIGIBLE_STATUSES } from '@/features/lead-management/config/qualification-form.config'
import { formatQualificationRating } from '@/features/lead-management/config/qualification-scoring.config'
import type { QualifyLeadResultDto } from '@/features/lead-management/domain/qualification.dto'
import { qualifyLeadSchema, type QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import {
  buildQualificationRecord,
  calculateQualificationScore,
} from '@/features/lead-management/lib/qualification-scoring'
import type {
  Lead,
  LeadExtras,
  LeadTimelineEvent,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import type { StoredActivity } from '@/features/lead-management/repositories/lead.repository.types'

export class LeadQualificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadQualificationError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export function canQualifyLead(status: LeadWorkflowStatus): boolean {
  return QUALIFY_ELIGIBLE_STATUSES.includes(status)
}

/** Lead qualification — validates, scores, persists to Dataverse via QualifyLead action. */
export class LeadQualificationService {
  async qualifyLead(
    leadId: string,
    input: QualifyLeadInput,
    qualifiedBy: string,
  ): Promise<QualifyLeadResultDto> {
    const parsed = qualifyLeadSchema.parse(input)
    const { lead: existing, extras: existingExtras } = await LeadApi.fetchLeadById(leadId)

    if (!canQualifyLead(existing.status)) {
      throw new LeadQualificationError(
        'Only leads with status New or Contacted can be qualified',
      )
    }

    const scoreResult = calculateQualificationScore(parsed, existing)
    const qualification = buildQualificationRecord(parsed, existing, qualifiedBy, scoreResult)

    await LeadApi.qualifyLead(leadId, {
      createAccount: true,
      createContact: true,
      createOpportunity: false,
    })

    const { lead: refreshed, extras: refreshedExtras } = await LeadApi.fetchLeadById(leadId)
    const today = new Date().toISOString().slice(0, 10)

    const updatedLead: Lead = {
      ...refreshed,
      priority: parsed.priority,
      expectedRevenue: Number(parsed.expectedRevenue),
      lastActivity: today,
      qualifiedDate: today,
      qualifiedBy,
      qualificationScore: scoreResult.score,
      qualificationRating: scoreResult.rating,
      score: Math.max(refreshed.score, scoreResult.score),
    }

    const timelineEvent: LeadTimelineEvent = {
      id: nextId('evt'),
      type: 'lead_qualified',
      title: 'Lead Qualified',
      description: `${existing.name} qualified with ${formatQualificationRating(scoreResult.rating)} rating (score ${scoreResult.score}).`,
      timestamp: new Date().toISOString(),
      actor: qualifiedBy,
      metadata: {
        score: String(scoreResult.score),
        rating: scoreResult.rating,
        qualifiedBy,
      },
    }

    const updatedExtras: LeadExtras = {
      ...refreshedExtras,
      ...existingExtras,
      qualification,
      timeline: [timelineEvent, ...(refreshedExtras.timeline ?? existingExtras.timeline ?? [])],
    }

    const activity: StoredActivity = {
      id: nextId('activity'),
      title: 'Lead Qualified',
      description: `${existing.name} — ${existing.company} · ${formatQualificationRating(scoreResult.rating)} (${scoreResult.score})`,
      timestamp: 'Just now',
      isoTimestamp: new Date().toISOString(),
      type: 'lead',
      entityId: leadId,
      entityType: 'lead',
    }

    return { lead: updatedLead, extras: updatedExtras, activity, qualification }
  }
}

export const leadQualificationService = new LeadQualificationService()
