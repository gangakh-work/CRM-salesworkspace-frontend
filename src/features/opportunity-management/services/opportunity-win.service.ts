import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import { buildWinSummary } from '@/features/opportunity-management/config/win-form.config'
import type { CloseOpportunityWonResultDto } from '@/features/opportunity-management/domain/win.dto'
import { closeAsWonSchema, type CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import { applyWinToOpportunity } from '@/features/opportunity-management/lib/win-record'
import {
  canMarkAsWon,
  formatStage,
  isOpportunityLocked,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  OpportunityActivity,
  OpportunityExtras,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
  OpportunityTimelineEvent,
} from '@/features/opportunity-management/types/opportunity.types'

export class OpportunityWinError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpportunityWinError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export class OpportunityWinService {
  async canCloseAsWon(opportunityId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { opportunity } = await OpportunityApi.fetchOpportunityById(opportunityId)
      if (opportunity.status === 'won') return { allowed: false, reason: 'Opportunity is already won' }
      if (opportunity.status === 'lost') return { allowed: false, reason: 'Lost opportunities cannot be marked as won' }
      if (opportunity.onHold) return { allowed: false, reason: 'Resume from hold before closing as won' }
      if (!canMarkAsWon(opportunity.stage)) {
        return {
          allowed: false,
          reason: `Only opportunities in ${formatStage('negotiation')} or ${formatStage('legal_review')} can be marked as Won`,
        }
      }
      return { allowed: true }
    } catch {
      return { allowed: false, reason: 'Opportunity not found' }
    }
  }

  async closeAsWon(
    opportunityId: string,
    input: CloseAsWonInput,
    closedBy: string,
  ): Promise<CloseOpportunityWonResultDto> {
    const parsed = closeAsWonSchema.parse(input)
    const eligibility = await this.canCloseAsWon(opportunityId)
    if (!eligibility.allowed) {
      throw new OpportunityWinError(eligibility.reason ?? 'Cannot close as won')
    }

    const { opportunity: existing, extras: existingExtras } =
      await OpportunityApi.fetchOpportunityById(opportunityId)
    const fromStage = existing.stage
    const now = new Date().toISOString()
    const today = now.slice(0, 10)

    await OpportunityApi.closeAsWon(opportunityId, parsed)
    const { opportunity: refreshed, extras: refreshedExtras } =
      await OpportunityApi.fetchOpportunityById(opportunityId)

    const updatedOpportunity = applyWinToOpportunity(refreshed, parsed, closedBy, today)
    const finalRevenue = updatedOpportunity.finalRevenue!

    const historyEntry: OpportunityStageHistoryEntry = {
      id: nextId('hist'),
      fromStage,
      toStage: 'won',
      transitionedAt: now,
      transitionedBy: closedBy,
      notes: buildWinSummary(parsed),
    }

    const auditRecord: OpportunityStageAuditRecord = {
      id: nextId('audit'),
      action: 'closed_won',
      fromStage,
      toStage: 'won',
      updatedAt: now,
      updatedBy: closedBy,
      details: `Closed as Won — ${buildWinSummary(parsed)}`,
    }

    const timelineEvents: OpportunityTimelineEvent[] = [
      {
        id: nextId('tl'),
        type: 'opportunity_won',
        title: 'Opportunity Won',
        description: `${existing.name} closed as Won in Dataverse.`,
        timestamp: now,
        actor: closedBy,
      },
    ]

    const winActivity: OpportunityActivity = {
      id: nextId('act'),
      type: 'task',
      subject: 'Win Recorded',
      status: 'completed',
      owner: closedBy,
      createdAt: today,
    }

    const updatedExtras: OpportunityExtras = {
      ...refreshedExtras,
      timeline: [...timelineEvents, ...(existingExtras.timeline ?? [])],
      activities: [winActivity, ...(refreshedExtras.activities ?? [])],
      stageHistory: [historyEntry, ...(refreshedExtras.stageHistory ?? [])],
      auditRecords: [auditRecord, ...(refreshedExtras.auditRecords ?? [])],
      commercials: {
        ...refreshedExtras.commercials,
        revenue: finalRevenue,
        currency: parsed.currency,
        forecast: 'closed',
      },
    }

    return {
      opportunity: updatedOpportunity,
      extras: updatedExtras,
      historyEntry,
      auditRecord,
      activity: {
        id: nextId('activity'),
        title: 'Opportunity Won',
        description: `${existing.name} · ${buildWinSummary(parsed)}`,
        timestamp: 'Just now',
        isoTimestamp: now,
        type: 'opportunity',
        entityId: opportunityId,
        entityType: 'opportunity',
      },
    }
  }
}

export const opportunityWinService = new OpportunityWinService()

export function assertOpportunityEditable(
  opportunity: { status: import('@/features/opportunity-management/types/opportunity.types').OpportunityStatus; locked?: boolean },
  isAdmin: boolean,
): void {
  if (isOpportunityLocked(opportunity) && !isAdmin) {
    throw new OpportunityWinError('Won opportunities are locked and can only be edited by administrators')
  }
}
