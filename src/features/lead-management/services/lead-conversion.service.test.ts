import { afterEach, describe, expect, it, vi } from 'vitest'

import { convertLeadSchema } from '@/features/lead-management/domain/conversion.schema'
import {
  canConvertLead,
  LeadConversionService,
} from '@/features/lead-management/services/lead-conversion.service'
import { dvLead, mockDataverse } from '@/test/dataverse-mock'

const validInput = {
  opportunityName: 'Acme Corp — Enterprise Deal',
  customer: 'Acme Corp',
  primaryContact: 'Jane Smith',
  expectedRevenue: '250000',
  estimatedCloseDate: '2026-12-31',
  salesStage: 'qualification' as const,
  forecastCategory: 'pipeline' as const,
  probability: '25',
  region: 'North America',
  businessUnit: 'Commercial Sales',
  industry: 'Technology',
  currency: 'USD',
  estimatedRevenue: '250000',
  expectedMargin: '32',
  priority: 'high' as const,
  confirmed: true,
}

describe('convertLeadSchema', () => {
  it('accepts valid conversion input', () => {
    expect(convertLeadSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects when confirmation is false', () => {
    const result = convertLeadSchema.safeParse({ ...validInput, confirmed: false })
    expect(result.success).toBe(false)
  })
})

describe('canConvertLead', () => {
  it('allows qualified leads without prior conversion', () => {
    expect(canConvertLead('qualified')).toBe(true)
  })

  it('blocks disqualified and converted leads', () => {
    expect(canConvertLead('disqualified')).toBe(false)
    expect(canConvertLead('converted', 'opp-1')).toBe(false)
    expect(canConvertLead('qualified', 'opp-1')).toBe(false)
  })
})

describe('LeadConversionService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('converts a qualified lead into a linked opportunity', async () => {
    const lead = dvLead({ statecode: 1, statuscode: 3 })
    const dv = mockDataverse({ leads: [lead] })

    const result = await new LeadConversionService().convertLead(String(lead.leadid), validInput, 'Vinay Kumar')

    expect(result.lead.status).toBe('converted')
    expect(result.lead.convertedOpportunityId).toBeTruthy()
    expect(result.lead.convertedBy).toBe('Vinay Kumar')
    expect(result.opportunity.leadId).toBe(lead.leadid)
    expect(result.opportunity.name).toBe(validInput.opportunityName)
    expect(result.extras.timeline.some((e) => e.type === 'converted')).toBe(true)
    expect(result.extras.timeline.some((e) => e.type === 'opportunity_created')).toBe(true)
    // Ownership: the converting user owns the new opportunity. (Older mock-repository code
    // logged an 'owner_assigned' timeline event; the Dataverse flow sets owner_name instead.)
    expect(result.opportunity.owner).toBe('Vinay Kumar')
    expect(result.opportunityExtras.timeline.some((e) => e.type === 'converted_from_lead')).toBe(true)
    expect(result.activity.type).toBe('opportunity')
    // Dataverse contract: one opportunity, linked to the lead, with the entered values
    const creates = dv.posts('/dataverse/opportunities').filter((c) => c.url === '/dataverse/opportunities')
    expect(creates).toHaveLength(1)
    expect(creates[0].body).toMatchObject({
      name: validInput.opportunityName,
      customer_name: validInput.customer,
      estimatedvalue: Number(validInput.estimatedRevenue),
      estimatedclosedate: validInput.estimatedCloseDate,
      closeprobability: Number(validInput.probability),
      lead_id: lead.leadid,
      owner_name: 'Vinay Kumar',
    })
    expect(dv.opportunities.has(result.opportunity.id)).toBe(true)
  })

  it('rejects conversion for disqualified lead', async () => {
    const lead = dvLead({ statecode: 2, statuscode: 4 })
    const dv = mockDataverse({ leads: [lead] })

    await expect(new LeadConversionService().convertLead(String(lead.leadid), validInput, 'Owner')).rejects.toThrow(
      'Disqualified leads cannot be converted',
    )
    expect(dv.posts('/dataverse/opportunities')).toHaveLength(0)
  })

  it('rejects conversion for a lead that is not qualified yet', async () => {
    const lead = dvLead({ statuscode: 2 })
    mockDataverse({ leads: [lead] })

    await expect(new LeadConversionService().convertLead(String(lead.leadid), validInput, 'Owner')).rejects.toThrow(
      'Only qualified leads can be converted',
    )
  })

  it('rejects duplicate conversion', async () => {
    const lead = dvLead({ statecode: 1, statuscode: 3 })
    const dv = mockDataverse({ leads: [lead] })
    const service = new LeadConversionService()

    await service.convertLead(String(lead.leadid), validInput, 'Vinay Kumar')

    await expect(service.convertLead(String(lead.leadid), validInput, 'Vinay Kumar')).rejects.toThrow(
      'already been converted',
    )
    expect(dv.posts('/dataverse/opportunities').filter((c) => c.url === '/dataverse/opportunities')).toHaveLength(1)
  })
})
