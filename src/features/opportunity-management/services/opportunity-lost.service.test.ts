import { afterEach, describe, expect, it, vi } from 'vitest'

import { closeAsLostSchema } from '@/features/opportunity-management/domain/lost.schema'
import {
  canMarkAsLost,
  canTransition,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import {
  OpportunityLostError,
  OpportunityLostService,
} from '@/features/opportunity-management/services/opportunity-lost.service'
import { dvOpportunity, mockDataverse } from '@/test/dataverse-mock'

const validInput = {
  lostReason: 'lost_to_competitor' as const,
  competitorName: 'Contoso Rival',
  competitorSolution: 'Enterprise Suite',
  priceDifference: '10% lower',
  lostRemarks: 'Customer chose competitor pricing.',
  willRevisit: 'no' as const,
  followUpDate: '',
  followUpOwner: '',
  confirmed: true,
}

describe('closeAsLostSchema', () => {
  it('accepts valid lost input', () => {
    expect(closeAsLostSchema.safeParse(validInput).success).toBe(true)
  })

  it('requires competitor name when lost to competitor', () => {
    const result = closeAsLostSchema.safeParse({
      ...validInput,
      competitorName: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires follow-up when revisiting', () => {
    const result = closeAsLostSchema.safeParse({
      ...validInput,
      willRevisit: 'yes',
      followUpDate: '',
      followUpOwner: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('canMarkAsLost', () => {
  it('allows commercial review, negotiation, and contract review', () => {
    expect(canMarkAsLost('commercial_review')).toBe(true)
    expect(canMarkAsLost('negotiation')).toBe(true)
    expect(canMarkAsLost('legal_review')).toBe(true)
    expect(canMarkAsLost('proposal')).toBe(false)
  })

  it('blocks lost via stage transition', () => {
    expect(canTransition('negotiation', 'lost')).toBe(false)
  })
})

describe('OpportunityLostService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('closes negotiation opportunity as lost end-to-end', async () => {
    const opp = dvOpportunity({ stepname: 'Negotiation' })
    const dv = mockDataverse({ opportunities: [opp] })
    const id = String(opp.opportunityid)

    const result = await new OpportunityLostService().closeAsLost(id, validInput, 'Vinay Kumar')

    expect(result.opportunity.status).toBe('lost')
    expect(result.opportunity.locked).toBe(true)
    expect(result.opportunity.lostReason).toBe('lost_to_competitor')
    expect(result.extras.timeline.some((e) => e.type === 'opportunity_lost')).toBe(true)
    expect(result.extras.timeline.some((e) => e.type === 'competitor_recorded')).toBe(true)
    expect(result.extras.activities.some((a) => a.subject.startsWith('Lost:'))).toBe(true)
    expect(result.auditRecord.action).toBe('closed_lost')
    expect(result.lostAnalysis.competitorName).toBe('Contoso Rival')
    // Dataverse contract: the configured Lose action with reason and competitor
    const [call] = dv.posts(`/dataverse/opportunities/${id}/lose`)
    expect(call.body).toMatchObject({ reason: 'lost_to_competitor', competitor_name: 'Contoso Rival' })
    expect(dv.opportunities.get(id)?.statecode).toBe(2)
  })

  it('creates follow-up activity when revisiting', async () => {
    const opp = dvOpportunity({ stepname: 'Legal Review' })
    mockDataverse({ opportunities: [opp] })

    const result = await new OpportunityLostService().closeAsLost(
      String(opp.opportunityid),
      {
        ...validInput,
        lostReason: 'no_decision',
        competitorName: '',
        willRevisit: 'yes',
        followUpDate: '2026-11-01',
        followUpOwner: 'Sarah Chen',
      },
      'Vinay Kumar',
    )

    expect(result.opportunity.willRevisit).toBe(true)
    expect(result.extras.timeline.some((e) => e.type === 'follow_up_created')).toBe(true)
    expect(result.extras.activities.some((a) => a.subject.startsWith('Follow-up:'))).toBe(true)
  })

  it('rejects proposal stage', async () => {
    const opp = dvOpportunity({ stepname: 'Proposal' })
    const dv = mockDataverse({ opportunities: [opp] })

    await expect(new OpportunityLostService().closeAsLost(String(opp.opportunityid), validInput, 'Vinay Kumar')).rejects.toBeInstanceOf(
      OpportunityLostError,
    )
    expect(dv.posts('/lose')).toHaveLength(0)
  })

  it('rejects won opportunity', async () => {
    const won = dvOpportunity({ statecode: 1 })
    const dv = mockDataverse({ opportunities: [won] })

    await expect(new OpportunityLostService().closeAsLost(String(won.opportunityid), validInput, 'Vinay Kumar')).rejects.toBeInstanceOf(
      OpportunityLostError,
    )
    expect(dv.posts('/lose')).toHaveLength(0)
  })

  it('returns lost analytics from lost opportunities', async () => {
    mockDataverse({
      opportunities: [
        dvOpportunity({ statecode: 2, estimatedvalue: 120000, statuscode: 4, '_statuscode@OData.Community.Display.V1.FormattedValue': 'Canceled' }),
        dvOpportunity({ statecode: 2, estimatedvalue: 80000 }),
        dvOpportunity({ statecode: 0, estimatedvalue: 999999 }),
      ],
    })

    const analytics = await new OpportunityLostService().getLostAnalytics()

    expect(analytics.totalLostRevenue).toBe(200000) // open deals excluded
    expect(analytics.topLostReasons.length).toBeGreaterThan(0)
  })
})
