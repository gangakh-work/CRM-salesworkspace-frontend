import type {
  AssignOwnerResultDto,
  DuplicateOpportunityResultDto,
  OnHoldResultDto,
  TransitionStageResultDto,
} from '@/features/opportunity-management/domain/stage.dto'
import {
  assignOwnerSchema,
  onHoldSchema,
  transitionStageSchema,
  type AssignOwnerInput,
  type OnHoldInput,
  type TransitionStageInput,
} from '@/features/opportunity-management/domain/stage.schema'
import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import {
  canTransition,
  formatStage,
  getNextStage,
  getPreviousStage,
  isClosedStage,
  isOpportunityLocked,
  stageToKanban,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  Opportunity,
  OpportunityActivity,
  OpportunityExtras,
  OpportunityStage,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
  OpportunityTimelineEvent,
} from '@/features/opportunity-management/types/opportunity.types'

export class OpportunityStageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpportunityStageError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

function emptyExtras(): OpportunityExtras {
  return {
    timeline: [],
    activities: [],
    contacts: [],
    notes: [],
    documents: [],
    meetings: [],
    emails: [],
    commercials: {
      revenue: 0,
      cost: 0,
      margin: 0,
      discount: 0,
      currency: 'USD',
      forecast: 'pipeline',
    },
    proposals: [],
    stageHistory: [],
    auditRecords: [],
  }
}

function normalizeExtras(extras: OpportunityExtras | undefined): OpportunityExtras {
  if (!extras) return emptyExtras()
  return {
    ...extras,
    stageHistory: extras.stageHistory ?? [],
    auditRecords: extras.auditRecords ?? [],
  }
}

/** Opportunity stage management — validates transitions, persists via Dataverse. */
export class OpportunityStageService {
  async canTransitionStage(
    opportunityId: string,
    targetStage: OpportunityStage,
    isAdmin = false,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { opportunity: existing } = await OpportunityApi.fetchOpportunityById(opportunityId)
      if (existing.onHold && targetStage !== existing.stage) {
        return { allowed: false, reason: 'Opportunity is on hold — resume before changing stage' }
      }
      if (!canTransition(existing.stage, targetStage, { isAdmin })) {
        return {
          allowed: false,
          reason: `Cannot move from ${formatStage(existing.stage)} to ${formatStage(targetStage)}`,
        }
      }
      return { allowed: true }
    } catch {
      return { allowed: false, reason: 'Opportunity not found' }
    }
  }

  async transitionStage(input: TransitionStageInput): Promise<TransitionStageResultDto> {
    const parsed = transitionStageSchema.parse(input)
    const eligibility = await this.canTransitionStage(
      parsed.opportunityId,
      parsed.targetStage,
      parsed.isAdmin,
    )
    if (!eligibility.allowed) {
      throw new OpportunityStageError(eligibility.reason ?? 'Stage transition not allowed')
    }

    const { opportunity: existing, extras: snapshotExtras } =
      await OpportunityApi.fetchOpportunityById(parsed.opportunityId)
    if (isOpportunityLocked(existing) && !parsed.isAdmin) {
      throw new OpportunityStageError('Won opportunities are locked and can only be edited by administrators')
    }
    if (parsed.targetStage === 'won') {
      throw new OpportunityStageError('Use Close as Won workflow to mark opportunities as won')
    }
    if (parsed.targetStage === 'lost') {
      throw new OpportunityStageError('Use Close as Lost workflow to mark opportunities as lost')
    }
    const fromStage = existing.stage
    const toStage = parsed.targetStage
    const now = new Date().toISOString()
    const today = now.slice(0, 10)

    await OpportunityApi.transitionStage(parsed)
    const updatedFromApi = await OpportunityApi.fetchOpportunityById(parsed.opportunityId)
    const updatedOpportunity: Opportunity = {
      ...updatedFromApi.opportunity,
      previousStage: fromStage,
      stageUpdatedAt: today,
      stageUpdatedBy: parsed.transitionedBy,
      lastActivity: today,
      kanbanColumn: stageToKanban(toStage),
      status: 'open',
    }

    const historyEntry: OpportunityStageHistoryEntry = {
      id: nextId('hist'),
      fromStage,
      toStage,
      transitionedAt: now,
      transitionedBy: parsed.transitionedBy,
      notes: parsed.notes,
    }

    const auditRecord: OpportunityStageAuditRecord = {
      id: nextId('audit'),
      action: 'stage_transition',
      fromStage,
      toStage,
      updatedAt: now,
      updatedBy: parsed.transitionedBy,
      details: parsed.notes ?? `Stage changed from ${formatStage(fromStage)} to ${formatStage(toStage)}`,
    }

    const timelineEvent: OpportunityTimelineEvent = {
      id: nextId('tl'),
      type: 'stage_changed',
      title: 'Stage Updated',
      description: `Moved from ${formatStage(fromStage)} to ${formatStage(toStage)}.`,
      timestamp: now,
      actor: parsed.transitionedBy,
    }

    const activity: OpportunityActivity = {
      id: nextId('act'),
      type: 'task',
      subject: `Stage transition: ${formatStage(fromStage)} → ${formatStage(toStage)}`,
      status: 'completed',
      owner: parsed.transitionedBy,
      createdAt: today,
    }

    const existingExtras = normalizeExtras(snapshotExtras)
    const updatedExtras: OpportunityExtras = {
      ...existingExtras,
      timeline: [timelineEvent, ...existingExtras.timeline],
      activities: [activity, ...existingExtras.activities],
      stageHistory: [historyEntry, ...existingExtras.stageHistory],
      auditRecords: [auditRecord, ...existingExtras.auditRecords],
      commercials: {
        ...existingExtras.commercials,
        forecast: updatedOpportunity.forecastCategory,
      },
    }

    return {
      opportunity: updatedOpportunity,
      extras: updatedExtras,
      fromStage,
      toStage,
      historyEntry,
      auditRecord,
    }
  }

  async moveToNextStage(
    opportunityId: string,
    transitionedBy: string,
    isAdmin = false,
  ): Promise<TransitionStageResultDto> {
    const { opportunity: existing } = await OpportunityApi.fetchOpportunityById(opportunityId)
    const next = getNextStage(existing.stage)
    if (!next) throw new OpportunityStageError('No next stage available')
    return this.transitionStage({
      opportunityId,
      targetStage: next,
      transitionedBy,
      isAdmin,
    })
  }

  async moveToPreviousStage(
    opportunityId: string,
    transitionedBy: string,
    isAdmin = false,
  ): Promise<TransitionStageResultDto> {
    const { opportunity: existing } = await OpportunityApi.fetchOpportunityById(opportunityId)
    const prev = getPreviousStage(existing.stage)
    if (!prev) throw new OpportunityStageError('No previous stage available')
    return this.transitionStage({
      opportunityId,
      targetStage: prev,
      transitionedBy,
      isAdmin,
    })
  }

  async assignOwner(input: AssignOwnerInput & { isAdmin?: boolean }): Promise<AssignOwnerResultDto> {
    const parsed = assignOwnerSchema.parse(input)
    const { opportunity: existing, extras } = await OpportunityApi.fetchOpportunityById(parsed.opportunityId)
    if (isOpportunityLocked(existing) && !input.isAdmin) {
      throw new OpportunityStageError('Won opportunities are locked and can only be edited by administrators')
    }

    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    const persisted = await OpportunityApi.assignOwner(parsed.opportunityId, parsed.owner)
    const updatedOpportunity: Opportunity = {
      ...persisted,
      stageUpdatedAt: today,
      stageUpdatedBy: parsed.assignedBy,
      lastActivity: today,
    }

    const auditRecord: OpportunityStageAuditRecord = {
      id: nextId('audit'),
      action: 'owner_assigned',
      updatedAt: now,
      updatedBy: parsed.assignedBy,
      details: `Owner assigned to ${parsed.owner}`,
    }

    const timelineEvent: OpportunityTimelineEvent = {
      id: nextId('tl'),
      type: 'owner_assigned',
      title: 'Owner Assigned',
      description: `${parsed.owner} assigned as opportunity owner.`,
      timestamp: now,
      actor: parsed.assignedBy,
    }

    const existingExtras = normalizeExtras(extras)
    const updatedExtras: OpportunityExtras = {
      ...existingExtras,
      timeline: [timelineEvent, ...existingExtras.timeline],
      auditRecords: [auditRecord, ...existingExtras.auditRecords],
    }

    return { opportunity: updatedOpportunity, extras: updatedExtras, auditRecord }
  }

  async setOnHold(input: OnHoldInput & { isAdmin?: boolean }): Promise<OnHoldResultDto> {
    const parsed = onHoldSchema.parse(input)
    const { opportunity: existing, extras } = await OpportunityApi.fetchOpportunityById(parsed.opportunityId)
    if (isOpportunityLocked(existing) && !input.isAdmin) {
      throw new OpportunityStageError('Won opportunities are locked and can only be edited by administrators')
    }
    if (isClosedStage(existing.stage)) {
      throw new OpportunityStageError('Closed opportunities cannot be placed on hold')
    }

    const now = new Date().toISOString()
    const persisted = await OpportunityApi.setOnHold(parsed.opportunityId, parsed.onHold)
    const updatedOpportunity: Opportunity = {
      ...persisted,
      lastActivity: now.slice(0, 10),
    }

    const auditRecord: OpportunityStageAuditRecord = {
      id: nextId('audit'),
      action: parsed.onHold ? 'on_hold' : 'off_hold',
      fromStage: existing.stage,
      updatedAt: now,
      updatedBy: parsed.updatedBy,
      details: parsed.onHold ? 'Opportunity marked on hold' : 'Opportunity resumed from hold',
    }

    const timelineEvent: OpportunityTimelineEvent = {
      id: nextId('tl'),
      type: parsed.onHold ? 'on_hold' : 'off_hold',
      title: parsed.onHold ? 'Marked On Hold' : 'Resumed from Hold',
      description: auditRecord.details ?? '',
      timestamp: now,
      actor: parsed.updatedBy,
    }

    const existingExtras = normalizeExtras(extras)
    const updatedExtras: OpportunityExtras = {
      ...existingExtras,
      timeline: [timelineEvent, ...existingExtras.timeline],
      auditRecords: [auditRecord, ...existingExtras.auditRecords],
    }

    return { opportunity: updatedOpportunity, extras: updatedExtras, auditRecord }
  }

  async duplicateOpportunity(
    sourceId: string,
    duplicatedBy: string,
    isAdmin = false,
  ): Promise<DuplicateOpportunityResultDto> {
    const { opportunity: source } = await OpportunityApi.fetchOpportunityById(sourceId)
    if (isOpportunityLocked(source) && !isAdmin) {
      throw new OpportunityStageError('Won opportunities are locked and can only be edited by administrators')
    }

    const created = await OpportunityApi.createOpportunity({
      name: `${source.name} (Copy)`,
      customerName: source.customer,
      estimatedvalue: source.expectedRevenue,
      estimatedclosedate: source.closeDate,
      closeprobability: 10,
      description: source.description,
      stepname: stageToKanban('prospect'),
      ownerName: duplicatedBy,
    })

    // createOpportunity does not send stepname to Dataverse, so the copy would land at
    // the default stage. Set Prospect explicitly with the same update stage changes use.
    created.opportunity = await OpportunityApi.transitionStage({
      opportunityId: created.opportunity.id,
      targetStage: 'prospect',
      transitionedBy: duplicatedBy,
    })

    const now = new Date().toISOString()
    created.extras.auditRecords = [{
      id: nextId('audit'),
      action: 'duplicate',
      fromStage: source.stage,
      toStage: 'prospect',
      updatedAt: now,
      updatedBy: duplicatedBy,
      details: `Duplicated from ${source.name}`,
    }]

    return { opportunity: created.opportunity, extras: created.extras }
  }
}

export const opportunityStageService = new OpportunityStageService()
