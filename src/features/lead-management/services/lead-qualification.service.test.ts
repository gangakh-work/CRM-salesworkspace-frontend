import { afterEach, describe, expect, it, vi } from 'vitest'

import { qualifyLeadSchema } from '@/features/lead-management/domain/qualification.schema'
import { calculateQualificationScore } from '@/features/lead-management/lib/qualification-scoring'
import {
  canQualifyLead,
  LeadQualificationService,
} from '@/features/lead-management/services/lead-qualification.service'
import { dvLead, mockDataverse } from '@/test/dataverse-mock'

const validInput = {
  productsInterested: 'Enterprise Platform',
  expectedRevenue: '250000',
  priority: 'high' as const,
  budgetRange: '100k-500k',
  buyingTimeline: 'quarter',
  decisionMaker: 'Jane Smith, VP',
  competitors: 'Competitor A',
  needConfirmed: 'yes' as const,
  budgetConfirmed: 'yes' as const,
  authorityConfirmed: 'yes' as const,
  timelineConfirmed: 'yes' as const,
  painPoints: 'Legacy system migration required.',
}

describe('qualifyLeadSchema', () => {
  it('accepts valid qualification input', () => {
    expect(qualifyLeadSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects missing pain points', () => {
    const result = qualifyLeadSchema.safeParse({ ...validInput, painPoints: '' })
    expect(result.success).toBe(false)
  })
})

describe('calculateQualificationScore', () => {
  it('returns hot rating for strong BANT input', () => {
    const result = calculateQualificationScore(validInput, { industry: 'Technology' })
    expect(result.rating).toBe('hot')
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.buyingIntent).toBe(4)
  })
})

describe('LeadQualificationService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('qualifies a contacted lead end-to-end', async () => {
    const lead = dvLead({ statuscode: 2 })
    const dv = mockDataverse({ leads: [lead] })
    const service = new LeadQualificationService()

    const result = await service.qualifyLead(String(lead.leadid), validInput, 'Vinay Kumar')

    expect(result.lead.status).toBe('qualified')
    expect(result.lead.qualifiedBy).toBe('Vinay Kumar')
    expect(result.lead.qualifiedDate).toBeTruthy()
    expect(result.lead.qualificationRating).toBe('hot')
    expect(result.extras.timeline.some((e) => e.type === 'lead_qualified')).toBe(true)
    expect(result.activity.title).toBe('Lead Qualified')
    // Dataverse contract: QualifyLead creates account + contact but NOT an opportunity
    // (conversion is a separate step).
    const [call] = dv.posts(`/dataverse/leads/${lead.leadid}/qualify`)
    expect(call.body).toEqual({ create_account: true, create_contact: true, create_opportunity: false })
    expect(dv.leads.get(String(lead.leadid))?.statecode).toBe(1)
  })

  it('rejects qualification for already qualified lead', async () => {
    const lead = dvLead({ statecode: 1, statuscode: 3 })
    const dv = mockDataverse({ leads: [lead] })

    await expect(new LeadQualificationService().qualifyLead(String(lead.leadid), validInput, 'Owner')).rejects.toThrow(
      'Only leads with status New or Contacted',
    )
    expect(dv.posts('/qualify')).toHaveLength(0) // nothing sent to Dataverse
  })

  it('surfaces a Dataverse failure instead of reporting success', async () => {
    const lead = dvLead({ statuscode: 1 })
    const dv = mockDataverse({ leads: [lead] })
    dv.failNext('/qualify', 400, 'QualifyLead failed: missing privilege')

    await expect(new LeadQualificationService().qualifyLead(String(lead.leadid), validInput, 'Owner')).rejects.toThrow(
      /missing privilege/,
    )
    expect(dv.leads.get(String(lead.leadid))?.statecode).toBe(0)
  })

  it('canQualifyLead allows draft, assigned, and contacted', () => {
    expect(canQualifyLead('draft')).toBe(true)
    expect(canQualifyLead('assigned')).toBe(true)
    expect(canQualifyLead('contacted')).toBe(true)
    expect(canQualifyLead('qualified')).toBe(false)
  })
})
