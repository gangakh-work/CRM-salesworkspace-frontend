import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import {
  buildLostSummary,
  getLostReasonLabel,
} from '@/features/opportunity-management/config/lost-form.config'
import type {
  CloseOpportunityLostResultDto,
  CompetitorAnalysisEntry,
  LostAnalyticsSummary,
  LostReasonCount,
} from '@/features/opportunity-management/domain/lost.dto'
import {
  closeAsLostSchema,
  type CloseAsLostInput,
} from '@/features/opportunity-management/domain/lost.schema'
import {
  applyLostToOpportunity,
  buildLostAnalysis,
} from '@/features/opportunity-management/lib/lost-record'
import {
  canMarkAsLost,
  formatStage,
  isOpportunityLocked,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  LostReason,
  OpportunityActivity,
  OpportunityExtras,
  OpportunityStageAuditRecord,
  OpportunityStageHistoryEntry,
  OpportunityTimelineEvent,
} from '@/features/opportunity-management/types/opportunity.types'

export class OpportunityLostError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpportunityLostError'
  }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

function normalizeExtras(extras: OpportunityExtras | undefined): OpportunityExtras {
  if (!extras) {
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
        forecast: 'omitted',
      },
      proposals: [],
      stageHistory: [],
      auditRecords: [],
    }
  }
  return {
    ...extras,
    stageHistory: extras.stageHistory ?? [],
    auditRecords: extras.auditRecords ?? [],
  }
}

/** Close opportunity as Lost — validates eligibility, persists via Dataverse LoseOpportunity. */
export class OpportunityLostService {
  async canCloseAsLost(opportunityId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { opportunity } = await OpportunityApi.fetchOpportunityById(opportunityId)
      if (opportunity.status === 'won') {
        return { allowed: false, reason: 'Won opportunities cannot be changed to Lost' }
      }
      if (opportunity.status === 'lost') return { allowed: false, reason: 'Opportunity is already lost' }
      if (opportunity.onHold) return { allowed: false, reason: 'Resume from hold before closing as lost' }
      if (!canMarkAsLost(opportunity.stage)) {
        return {
          allowed: false,
          reason: `Only opportunities in ${formatStage('commercial_review')}, ${formatStage('negotiation')}, or ${formatStage('legal_review')} can be marked as Lost`,
        }
      }
      return { allowed: true }
    } catch {
      return { allowed: false, reason: 'Opportunity not found' }
    }
  }

  async closeAsLost(
    opportunityId: string,
    input: CloseAsLostInput,
    lostBy: string,
  ): Promise<CloseOpportunityLostResultDto> {
    const parsed = closeAsLostSchema.parse(input)
    const eligibility = await this.canCloseAsLost(opportunityId)
    if (!eligibility.allowed) {
      throw new OpportunityLostError(eligibility.reason ?? 'Cannot close as lost')
    }

    const { opportunity: existing, extras: existingExtras } =
      await OpportunityApi.fetchOpportunityById(opportunityId)
    const fromStage = existing.stage
    const now = new Date().toISOString()
    const today = now.slice(0, 10)

    await OpportunityApi.closeAsLost(opportunityId, parsed)
    const { opportunity: refreshed, extras: refreshedExtras } =
      await OpportunityApi.fetchOpportunityById(opportunityId)

    const updatedOpportunity = applyLostToOpportunity(refreshed, parsed, lostBy, today)
    const lostAnalysis = buildLostAnalysis(existing, parsed)
    const reasonLabel = getLostReasonLabel(parsed.lostReason)

    const historyEntry: OpportunityStageHistoryEntry = {
      id: nextId('hist'),
      fromStage,
      toStage: 'lost',
      transitionedAt: now,
      transitionedBy: lostBy,
      notes: buildLostSummary(parsed),
    }

    const auditRecord: OpportunityStageAuditRecord = {
      id: nextId('audit'),
      action: 'closed_lost',
      fromStage,
      toStage: 'lost',
      updatedAt: now,
      updatedBy: lostBy,
      details: `Closed as Lost — ${buildLostSummary(parsed)}`,
    }

    const timelineEvents: OpportunityTimelineEvent[] = [
      {
        id: nextId('tl'),
        type: 'opportunity_lost',
        title: 'Opportunity Lost',
        description: `${existing.name} closed as Lost.`,
        timestamp: now,
        actor: lostBy,
      },
      {
        id: nextId('tl'),
        type: 'reason_recorded',
        title: 'Reason Recorded',
        description: `Lost reason: ${reasonLabel}.`,
        timestamp: now,
        actor: lostBy,
      },
    ]

    if (parsed.competitorName?.trim()) {
      timelineEvents.push({
        id: nextId('tl'),
        type: 'competitor_recorded',
        title: 'Competitor Recorded',
        description: `Lost to ${parsed.competitorName}${parsed.competitorSolution ? ` (${parsed.competitorSolution})` : ''}.`,
        timestamp: now,
        actor: lostBy,
      })
    }

    if (parsed.willRevisit === 'yes') {
      timelineEvents.push({
        id: nextId('tl'),
        type: 'follow_up_created',
        title: 'Follow-up Created',
        description: `Revisit planned on ${parsed.followUpDate} · Owner: ${parsed.followUpOwner}.`,
        timestamp: now,
        actor: lostBy,
      })
    }

    const lostActivity: OpportunityActivity = {
      id: nextId('act'),
      type: 'task',
      subject: `Lost: ${reasonLabel}`,
      status: 'completed',
      owner: lostBy,
      createdAt: today,
    }

    const followUpActivity: OpportunityActivity | null =
      parsed.willRevisit === 'yes'
        ? {
            id: nextId('act'),
            type: 'task',
            subject: `Follow-up: ${existing.customer}`,
            status: 'planned',
            dueDate: parsed.followUpDate,
            owner: parsed.followUpOwner ?? lostBy,
            createdAt: today,
          }
        : null

    const normalizedExtras = normalizeExtras(existingExtras)
    const updatedExtras: OpportunityExtras = {
      ...refreshedExtras,
      timeline: [...timelineEvents, ...normalizedExtras.timeline],
      activities: [
        lostActivity,
        ...(followUpActivity ? [followUpActivity] : []),
        ...normalizedExtras.activities,
      ],
      stageHistory: [historyEntry, ...normalizedExtras.stageHistory],
      auditRecords: [auditRecord, ...normalizedExtras.auditRecords],
      lostAnalysis,
      commercials: {
        ...normalizedExtras.commercials,
        forecast: 'omitted',
      },
    }

    return {
      opportunity: updatedOpportunity,
      extras: updatedExtras,
      historyEntry,
      auditRecord,
      activity: {
        id: nextId('activity'),
        title: 'Opportunity Lost',
        description: `${existing.name} · ${buildLostSummary(parsed)}`,
        timestamp: 'Just now',
        isoTimestamp: now,
        type: 'opportunity',
        entityId: opportunityId,
        entityType: 'opportunity',
      },
      lostAnalysis,
    }
  }

  private async loadAll() {
    return OpportunityApi.fetchOpportunities()
  }

  async getLostAnalytics(): Promise<LostAnalyticsSummary> {
    const { opportunities, opportunityExtras } = await this.loadAll()
    const lost = opportunities.filter((o) => o.status === 'lost')

    const reasonMap = new Map<LostReason, number>()
    const competitorMap = new Map<string, { count: number; revenue: number }>()
    const industryMap = new Map<string, { count: number; revenue: number }>()
    const regionMap = new Map<string, { count: number; revenue: number }>()

    for (const opp of lost) {
      const analysis = opportunityExtras[opp.id]?.lostAnalysis
      const reason = opp.lostReason ?? analysis?.reason ?? 'other'
      reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1)

      const revenue = analysis?.lostRevenue ?? opp.expectedRevenue
      const industry = opp.industry
      const region = opp.region
      const ind = industryMap.get(industry) ?? { count: 0, revenue: 0 }
      industryMap.set(industry, { count: ind.count + 1, revenue: ind.revenue + revenue })
      const reg = regionMap.get(region) ?? { count: 0, revenue: 0 }
      regionMap.set(region, { count: reg.count + 1, revenue: reg.revenue + revenue })

      const competitor = opp.competitorName ?? analysis?.competitorName
      if (competitor?.trim()) {
        const c = competitorMap.get(competitor) ?? { count: 0, revenue: 0 }
        competitorMap.set(competitor, { count: c.count + 1, revenue: c.revenue + revenue })
      }
    }

    const topLostReasons: LostReasonCount[] = [...reasonMap.entries()]
      .map(([reason, count]) => ({
        reason,
        label: getLostReasonLabel(reason),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    const competitorAnalysis: CompetitorAnalysisEntry[] = [...competitorMap.entries()]
      .map(([competitor, data]) => ({
        competitor,
        count: data.count,
        totalLostRevenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)

    const totalLostRevenue = lost.reduce(
      (sum, o) => sum + (opportunityExtras[o.id]?.lostAnalysis?.lostRevenue ?? o.expectedRevenue),
      0,
    )

    return {
      topLostReasons,
      competitorAnalysis,
      industryAnalysis: [...industryMap.entries()]
        .map(([industry, data]) => ({ industry, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      regionAnalysis: [...regionMap.entries()]
        .map(([region, data]) => ({ region, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      averageLostDealSize: lost.length > 0 ? Math.round(totalLostRevenue / lost.length) : 0,
      totalLostRevenue,
    }
  }
}

export const opportunityLostService = new OpportunityLostService()

export function assertLostOpportunityEditable(
  opportunity: { status: import('@/features/opportunity-management/types/opportunity.types').OpportunityStatus; locked?: boolean },
  isAdmin: boolean,
): void {
  if (isOpportunityLocked(opportunity) && !isAdmin) {
    throw new OpportunityLostError('Lost opportunities are locked and can only be edited by administrators')
  }
}
