import type { CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import { stageToKanban } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export function applyWinToOpportunity(
  existing: Opportunity,
  input: CloseAsWonInput,
  closedBy: string,
  closedDate: string,
): Opportunity {
  const finalRevenue = Number(input.finalRevenue)
  const marginPct = Number(input.margin)

  return {
    ...existing,
    stage: 'won',
    status: 'won',
    probability: 100,
    forecastCategory: 'closed',
    kanbanColumn: stageToKanban('won'),
    expectedRevenue: finalRevenue,
    finalRevenue,
    finalMargin: Math.round(finalRevenue * (marginPct / 100)),
    contractValue: Number(input.contractValue),
    currency: input.currency,
    closeDate: closedDate,
    closedDate,
    closedBy,
    locked: true,
    onHold: false,
    decisionMaker: input.decisionMaker,
    contractStartDate: input.contractStartDate,
    contractEndDate: input.contractEndDate,
    expectedKickoff: input.expectedKickoff,
    deliveryOwner: input.deliveryOwner,
    businessUnit: input.businessUnit,
    previousStage: existing.stage,
    stageUpdatedAt: closedDate,
    stageUpdatedBy: closedBy,
    lastActivity: closedDate,
  }
}
