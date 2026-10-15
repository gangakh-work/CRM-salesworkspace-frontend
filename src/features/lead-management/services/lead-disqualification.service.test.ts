import { afterEach, describe, expect, it, vi } from 'vitest'

import { disqualifyLeadSchema } from '@/features/lead-management/domain/disqualification.schema'
import {
  canDisqualifyLead,
  LeadDisqualificationService,
} from '@/features/lead-management/services/lead-disqualification.service'
import { mapToDataverseDisqualifyReason } from '@/features/lead-management/lib/disqualify-reason-mapper'
import { dvLead, dvOpportunity, mockDataverse } from '@/test/dataverse-mock'

const validInput = {
  reason: 'budget_constraints' as const,
  competitorName: 'Acme Corp',
  remarks: 'Budget cycle closed for this year.',
  scheduleFollowUp: true,
  revisitAfterDays: '90' as const,
  followUpOwner: 'Vinay Kumar',
}

describe('disqualifyLeadSchema', () => {
  it('accepts valid disqualification input', () => {
    expect(disqualifyLeadSchema.safeParse(validInput).success).toBe(true)
  })

  it('requires follow-up fields when scheduleFollowUp is true', () => {
    const result = disqualifyLeadSchema.safeParse({
      reason: 'no_response',
      scheduleFollowUp: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts minimal input without follow-up', () => {
    expect(
      disqualifyLeadSchema.safeParse({
        reason: 'duplicate_lead',
        scheduleFollowUp: false,
      }).success,
    ).toBe(true)
  })
})

describe('LeadDisqualificationService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('disqualifies a contacted lead end-to-end', async () => {
    const lead = dvLead({ statuscode: 2 })
    const dv = mockDataverse({ leads: [lead] })

    const result = await new LeadDisqualificationService().disqualifyLead(String(lead.leadid), validInput, 'Vinay Kumar')

    expect(result.lead.status).toBe('disqualified')
    expect(result.lead.disqualifiedBy).toBe('Vinay Kumar')
    expect(result.lead.disqualificationReason).toBe('budget_constraints')
    expect(result.extras.disqualification?.reason).toBe('budget_constraints')
    expect(result.extras.timeline.some((e) => e.type === 'disqualified')).toBe(true)
    expect(result.extras.timeline.some((e) => e.type === 'disqualification_reason')).toBe(true)
    expect(result.extras.timeline.some((e) => e.type === 'follow_up_scheduled')).toBe(true)
    expect(result.extras.activities.some((a) => a.subject.includes('Revisit'))).toBe(true)
    expect(result.activity.title).toBe('Lead Disqualified')
    // Dataverse contract: the configured DisqualifyLead action, with the mapped reason
    const [call] = dv.posts(`/dataverse/leads/${lead.leadid}/disqualify`)
    expect((call.body as { reason: string }).reason).toBe(mapToDataverseDisqualifyReason('budget_constraints'))
    expect(dv.leads.get(String(lead.leadid))?.statecode).toBe(2)
  })

  it('rejects disqualification for an already disqualified lead', async () => {
    const lead = dvLead({ statecode: 2, statuscode: 4 })
    const dv = mockDataverse({ leads: [lead] })

    await expect(
      new LeadDisqualificationService().disqualifyLead(String(lead.leadid), validInput, 'Owner'),
    ).rejects.toThrow('Only leads with status New, Contacted, or Qualified')
    expect(dv.posts('/disqualify')).toHaveLength(0)
  })

  it('rejects disqualification for a lead linked to a won opportunity', async () => {
    const lead = dvLead({ statecode: 1, statuscode: 3 })
    const won = dvOpportunity({ statecode: 1, _originatingleadid_value: lead.leadid })
    const dv = mockDataverse({ leads: [lead], opportunities: [won] })

    await expect(
      new LeadDisqualificationService().disqualifyLead(String(lead.leadid), validInput, 'Owner'),
    ).rejects.toThrow('Leads linked to won or lost opportunities cannot be disqualified')
    expect(dv.posts('/disqualify')).toHaveLength(0)
  })

  it('canDisqualifyLead allows draft, assigned, contacted, and qualified', () => {
    expect(canDisqualifyLead('draft')).toBe(true)
    expect(canDisqualifyLead('assigned')).toBe(true)
    expect(canDisqualifyLead('contacted')).toBe(true)
    expect(canDisqualifyLead('qualified')).toBe(true)
    expect(canDisqualifyLead('negotiation')).toBe(false)
  })
})
