import { getLostReasonLabel } from '@/features/opportunity-management/config/lost-form.config'
import type { CloseAsLostInput } from '@/features/opportunity-management/domain/lost.schema'
import { stageToKanban } from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  Opportunity,
  OpportunityLostAnalysis,
} from '@/features/opportunity-management/types/opportunity.types'

export function applyLostToOpportunity(
  existing: Opportunity,
  input: CloseAsLostInput,
  lostBy: string,
  lostDate: string,
): Opportunity {
  const willRevisit = input.willRevisit === 'yes'

  return {
    ...existing,
    stage: 'lost',
    status: 'lost',
    probability: 0,
    forecastCategory: 'omitted',
    kanbanColumn: stageToKanban('lost'),
    closeDate: lostDate,
    lostDate,
    lostBy,
    lostReason: input.lostReason,
    competitorName: input.competitorName?.trim() || undefined,
    competitorSolution: input.competitorSolution?.trim() || undefined,
    priceDifference: input.priceDifference?.trim() || undefined,
    lostRemarks: input.lostRemarks?.trim() || undefined,
    willRevisit,
    followUpDate: willRevisit ? input.followUpDate : undefined,
    followUpOwner: willRevisit ? input.followUpOwner : undefined,
    locked: true,
    onHold: false,
    previousStage: existing.stage,
    stageUpdatedAt: lostDate,
    stageUpdatedBy: lostBy,
    lastActivity: lostDate,
  }
}

export function buildLostAnalysis(
  opportunity: Opportunity,
  input: CloseAsLostInput,
): OpportunityLostAnalysis {
  return {
    reason: input.lostReason,
    reasonLabel: getLostReasonLabel(input.lostReason),
    competitorName: input.competitorName?.trim() || undefined,
    competitorSolution: input.competitorSolution?.trim() || undefined,
    priceDifference: input.priceDifference?.trim() || undefined,
    remarks: input.lostRemarks?.trim() || undefined,
    willRevisit: input.willRevisit === 'yes',
    followUpDate: input.willRevisit === 'yes' ? input.followUpDate : undefined,
    followUpOwner: input.willRevisit === 'yes' ? input.followUpOwner : undefined,
    lostRevenue: opportunity.expectedRevenue,
    industry: opportunity.industry,
    region: opportunity.region,
  }
}
