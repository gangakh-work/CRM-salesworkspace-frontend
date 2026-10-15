import type { IOpportunityRepository, OpportunityStoreSnapshot } from '@/features/opportunity-management/repositories/opportunity.repository.types'
import type { Opportunity, OpportunityExtras } from '@/features/opportunity-management/types/opportunity.types'

/** In-memory opportunity repository for tests and legacy flows. */
export class InMemoryOpportunityRepository implements IOpportunityRepository {
  private snapshot: OpportunityStoreSnapshot = {
    opportunities: [],
    opportunityExtras: {},
  }

  async load(): Promise<OpportunityStoreSnapshot> {
    return {
      opportunities: [...this.snapshot.opportunities],
      opportunityExtras: { ...this.snapshot.opportunityExtras },
    }
  }

  async replaceSnapshot(snapshot: OpportunityStoreSnapshot): Promise<void> {
    this.snapshot = {
      opportunities: [...snapshot.opportunities],
      opportunityExtras: { ...snapshot.opportunityExtras },
    }
  }

  async saveOpportunity(opportunity: Opportunity, extras: OpportunityExtras): Promise<void> {
    const snapshot = await this.load()
    snapshot.opportunities = [
      opportunity,
      ...snapshot.opportunities.filter((o) => o.id !== opportunity.id),
    ]
    snapshot.opportunityExtras = {
      ...snapshot.opportunityExtras,
      [opportunity.id]: extras,
    }
    await this.replaceSnapshot(snapshot)
  }

  async getCount(): Promise<number> {
    const snapshot = await this.load()
    return snapshot.opportunities.length
  }
}
