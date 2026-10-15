import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'

export interface StoredActivity {
  id: string
  title: string
  description: string
  timestamp: string
  isoTimestamp: string
  type: 'lead' | 'opportunity' | 'proposal' | 'meeting' | 'email'
  entityId?: string
  entityType?: string
}

export interface LeadStoreSnapshot {
  leads: Lead[]
  leadExtras: Record<string, LeadExtras>
  activities: StoredActivity[]
}

export interface ILeadRepository {
  load(): Promise<LeadStoreSnapshot>
  saveLead(lead: Lead, extras: LeadExtras): Promise<Lead>
  updateLead(lead: Lead): Promise<Lead>
  updateExtras(leadId: string, extras: LeadExtras): Promise<void>
  deleteLead(leadId: string): Promise<void>
  addActivity(activity: StoredActivity): Promise<StoredActivity>
  getActivities(limit?: number): Promise<StoredActivity[]>
  getLeadCount(): Promise<number>
  getActiveLeadCount(): Promise<number>
  replaceSnapshot(snapshot: LeadStoreSnapshot): Promise<void>
}
