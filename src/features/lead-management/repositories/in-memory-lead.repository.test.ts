import { describe, expect, it } from 'vitest'

import { InMemoryLeadRepository } from '@/features/lead-management/repositories/in-memory-lead.repository'
import type { Lead, LeadExtras } from '@/features/lead-management/types/lead.types'

const sampleLead: Lead = {
  id: 'lead-test-1',
  name: 'Test User',
  company: 'Test Corp',
  industry: 'Technology',
  country: 'United States',
  owner: 'Owner',
  source: 'Website',
  priority: 'medium',
  score: 50,
  status: 'draft',
  expectedRevenue: 100000,
  createdDate: '2026-08-04',
  lastActivity: '2026-08-04',
  nextFollowUp: '2026-09-01',
  email: 'test@test.com',
  phone: '+1 555 0000',
  title: 'Manager',
  kanbanColumn: 'Draft',
}

const sampleExtras: LeadExtras = {
  timeline: [],
  activities: [],
  notes: [],
  attachments: [],
  meetings: [],
  emails: [],
}

describe('InMemoryLeadRepository', () => {
  it('persists lead and extras on saveLead', async () => {
    const repo = new InMemoryLeadRepository()
    await repo.saveLead(sampleLead, sampleExtras)

    const snapshot = await repo.load()
    expect(snapshot.leads.find((l) => l.id === sampleLead.id)).toBeDefined()
    expect(snapshot.leadExtras[sampleLead.id]).toEqual(sampleExtras)
  })

  it('prepends activities and respects limit', async () => {
    const repo = new InMemoryLeadRepository()
    await repo.addActivity({
      id: 'a1',
      title: 'Lead Created',
      description: 'Test',
      timestamp: 'Just now',
      isoTimestamp: new Date().toISOString(),
      type: 'lead',
    })

    const activities = await repo.getActivities(5)
    expect(activities).toHaveLength(1)
    expect(activities[0]?.title).toBe('Lead Created')
  })
})
