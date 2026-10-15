import {
  formatStage,
  OPEN_STAGE_ORDER,
  STAGE_PROBABILITY,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type {
  ForecastCategory,
  ForecastMetrics,
  Opportunity,
  OpportunityStage,
  StageDistributionEntry,
} from '@/features/opportunity-management/types/opportunity.types'

/** Computes pipeline, weighted, and category metrics from live opportunity data. */
export class ForecastEngineService {
  computeForecastMetrics(opportunities: Opportunity[]): ForecastMetrics {
    const open = opportunities.filter((o) => o.status === 'open' && !o.onHold)
    const pipelineValue = open.reduce((sum, o) => sum + o.expectedRevenue, 0)
    const weightedRevenue = open.reduce(
      (sum, o) => sum + o.expectedRevenue * (o.probability / 100),
      0,
    )
    const won = opportunities.filter((o) => o.status === 'won')
    const wonRevenue = won.reduce((sum, o) => sum + (o.finalRevenue ?? o.expectedRevenue), 0)
    const quarterRevenue = wonRevenue + weightedRevenue * 0.3
    const averageWinProbability =
      open.length > 0
        ? Math.round(open.reduce((sum, o) => sum + o.probability, 0) / open.length)
        : 0

    const closed = opportunities.filter((o) => o.status === 'won' || o.status === 'lost')
    const forecastAccuracy =
      closed.length > 0
        ? Math.round((won.length / closed.length) * 100)
        : 0

    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3) + 1
    const quarterLabel = `Q${quarter} ${now.getFullYear()}`

    return {
      quarterRevenue,
      pipelineValue,
      weightedRevenue,
      expectedRevenue: pipelineValue,
      forecastAccuracy,
      quarterLabel,
      averageWinProbability,
    }
  }

  getStageDistribution(opportunities: Opportunity[]): StageDistributionEntry[] {
    const openStages = [...OPEN_STAGE_ORDER, 'won' as OpportunityStage, 'lost' as OpportunityStage]

    return openStages.map((stage) => {
      const inStage = opportunities.filter((o) => o.stage === stage)
      const value = inStage.reduce((sum, o) => sum + o.expectedRevenue, 0)
      const weightedValue = inStage.reduce(
        (sum, o) => sum + o.expectedRevenue * (o.probability / 100),
        0,
      )
      return {
        stage,
        label: formatStage(stage),
        count: inStage.length,
        value,
        weightedValue,
      }
    })
  }

  calculateForecastCategory(stage: OpportunityStage, probability: number): ForecastCategory {
    if (stage === 'won') return 'closed'
    if (stage === 'lost') return 'omitted'
    if (stage === 'legal_review' || (stage === 'negotiation' && probability >= 70)) return 'commit'
    if (stage === 'negotiation' || stage === 'commercial_review' || probability >= 50) return 'best_case'
    return 'pipeline'
  }

  recalculateForStage(_opportunity: Opportunity, stage: OpportunityStage): Partial<Opportunity> {
    const probability = STAGE_PROBABILITY[stage]
    return {
      stage,
      probability,
      forecastCategory: this.calculateForecastCategory(stage, probability),
    }
  }
}

export const forecastEngineService = new ForecastEngineService()
