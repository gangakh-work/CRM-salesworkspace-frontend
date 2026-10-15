import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import type { CreateOpportunityPayload } from '@/features/opportunity-management/api/OpportunityApi'
import { forecastEngineService } from '@/features/opportunity-management/services/forecast-engine.service'
import { opportunityLostService } from '@/features/opportunity-management/services/opportunity-lost.service'
import type {
  ForecastMetrics,
  Opportunity,
  OpportunityExtras,
  StageDistributionEntry,
} from '@/features/opportunity-management/types/opportunity.types'

export class OpportunityService {
  async getAll(): Promise<{ opportunities: Opportunity[]; opportunityExtras: Record<string, OpportunityExtras> }> {
    return OpportunityApi.fetchOpportunities()
  }

  async getByLeadId(leadId: string): Promise<Opportunity[]> {
    const { opportunities } = await this.getAll()
    return opportunities.filter((o) => o.leadId === leadId)
  }

  async getById(id: string): Promise<Opportunity | undefined> {
    try {
      const { opportunity } = await OpportunityApi.fetchOpportunityById(id)
      return opportunity
    } catch {
      return undefined
    }
  }

  async createOpportunity(payload: CreateOpportunityPayload) {
    return OpportunityApi.createOpportunity(payload)
  }

  async persistOpportunityUpdate(opportunity: Opportunity): Promise<Opportunity> {
    return OpportunityApi.updateOpportunityFromModel(opportunity)
  }

  async getOpenOpportunityCount(): Promise<number> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return opportunities.filter((o) => o.status === 'open').length
  }

  async getPipelineValue(): Promise<number> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return opportunities
      .filter((o) => o.status === 'open')
      .reduce((sum, o) => sum + o.expectedRevenue, 0)
  }

  async getExpectedRevenue(): Promise<number> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return forecastEngineService.computeForecastMetrics(opportunities).weightedRevenue
  }

  async getForecastMetrics(): Promise<ForecastMetrics> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return forecastEngineService.computeForecastMetrics(opportunities)
  }

  async getStageDistribution(): Promise<StageDistributionEntry[]> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return forecastEngineService.getStageDistribution(opportunities)
  }

  async getWinRate(): Promise<number> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    const closed = opportunities.filter((o) => o.status === 'won' || o.status === 'lost')
    if (closed.length === 0) return 0
    const won = closed.filter((o) => o.status === 'won').length
    return Math.round((won / closed.length) * 100)
  }

  async getWonRevenue(): Promise<number> {
    const { opportunities } = await OpportunityApi.fetchOpportunities()
    return opportunities
      .filter((o) => o.status === 'won')
      .reduce((sum, o) => sum + (o.finalRevenue ?? o.expectedRevenue), 0)
  }

  async getLostAnalytics() {
    return opportunityLostService.getLostAnalytics()
  }
}

export const opportunityService = new OpportunityService()
