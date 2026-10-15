import type {
  ILeadRepository,
  LeadStoreSnapshot,
  StoredActivity,
} from '@/features/lead-management/repositories/lead.repository.types'
import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'

/** In-memory repository for tests and fallback mode — starts empty (live data via LeadApi). */
export class InMemoryLeadRepository implements ILeadRepository {
  private snapshot: LeadStoreSnapshot = {
    leads: [],
    leadExtras: {},
    activities: [],
  }

  async load(): Promise<LeadStoreSnapshot> {
    return {
      leads: [...this.snapshot.leads],
      leadExtras: { ...this.snapshot.leadExtras },
      activities: [...this.snapshot.activities],
    }
  }

  private persist(snapshot: LeadStoreSnapshot): void {
    this.snapshot = snapshot
  }

  async saveLead(lead: Lead, extras: LeadExtras): Promise<Lead> {
    const snapshot = await this.load()
    snapshot.leads = [lead, ...snapshot.leads.filter((l) => l.id !== lead.id)]
    snapshot.leadExtras = { ...snapshot.leadExtras, [lead.id]: extras }
    this.persist(snapshot)
    return lead
  }

  async updateLead(lead: Lead): Promise<Lead> {
    const snapshot = await this.load()
    snapshot.leads = snapshot.leads.map((l) => (l.id === lead.id ? lead : l))
    this.persist(snapshot)
    return lead
  }

  async updateExtras(leadId: string, extras: LeadExtras): Promise<void> {
    const snapshot = await this.load()
    snapshot.leadExtras = { ...snapshot.leadExtras, [leadId]: extras }
    this.persist(snapshot)
  }

  async deleteLead(leadId: string): Promise<void> {
    const snapshot = await this.load()
    snapshot.leads = snapshot.leads.filter((l) => l.id !== leadId)
    const rest = { ...snapshot.leadExtras }
    delete rest[leadId]
    snapshot.leadExtras = rest
    this.persist(snapshot)
  }

  async addActivity(activity: StoredActivity): Promise<StoredActivity> {
    const snapshot = await this.load()
    snapshot.activities = [activity, ...snapshot.activities].slice(0, 50)
    this.persist(snapshot)
    return activity
  }

  async getActivities(limit = 20): Promise<StoredActivity[]> {
    return (await this.load()).activities.slice(0, limit)
  }

  async getLeadCount(): Promise<number> {
    return (await this.load()).leads.length
  }

  async getActiveLeadCount(): Promise<number> {
    return (await this.load()).leads.filter(
      (l) => l.status !== 'converted' && l.status !== 'disqualified',
    ).length
  }

  async replaceSnapshot(snapshot: LeadStoreSnapshot): Promise<void> {
    this.persist(snapshot)
  }
}
