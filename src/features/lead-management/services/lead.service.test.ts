import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CREATE_LEAD_DEFAULT_VALUES } from '@/features/lead-management/config/lead-form.config'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import { LeadService } from '@/features/lead-management/services/lead.service'

vi.mock('@/features/lead-management/api/LeadApi', () => ({
  LeadApi: {
    createLead: vi.fn(),
    fetchLeads: vi.fn(),
  },
}))

describe('LeadService.createLead', () => {
  let service: LeadService

  beforeEach(() => {
    service = new LeadService()
    vi.clearAllMocks()
  })

  it('creates lead via Dataverse API and returns activity metadata', async () => {
    const input = {
      ...CREATE_LEAD_DEFAULT_VALUES,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@fabrikam.com',
      phone: '+1 555 0199',
      title: 'Director',
      companyName: 'Fabrikam Inc',
      industry: 'Manufacturing',
      country: 'United States',
      opportunityName: 'Cloud Migration',
      expectedRevenue: '340000',
      closeDate: '2026-09-30',
      source: 'Referral',
      priority: 'high' as const,
      notes: 'Initial discovery call completed.',
    }

    vi.mocked(LeadApi.createLead).mockResolvedValue({
      lead: {
        id: 'lead-1',
        name: 'Alex Rivera',
        company: 'Fabrikam Inc',
        industry: 'Manufacturing',
        country: 'United States',
        owner: 'Vinay Kumar',
        source: 'Referral',
        priority: 'high',
        score: 50,
        status: 'assigned',
        createdDate: '2026-08-06',
        lastActivity: '2026-08-06',
        nextFollowUp: '2026-08-06',
        email: 'alex@fabrikam.com',
        phone: '+1 555 0199',
        title: 'Director',
        kanbanColumn: 'assigned',
      },
      extras: {
        timeline: [{ id: 'evt-1', type: 'lead_created', title: 'Lead in Dataverse', description: 'Created', timestamp: '2026-08-06', actor: 'Vinay Kumar' }],
        activities: [],
        notes: [],
        attachments: [],
        meetings: [],
        emails: [],
      },
    })

    const result = await service.createLead(input, 'Vinay Kumar')

    expect(LeadApi.createLead).toHaveBeenCalledOnce()
    expect(result.lead.name).toBe('Alex Rivera')
    expect(result.lead.company).toBe('Fabrikam Inc')
    expect(result.activity.title).toBe('Lead Created')
  })
})
