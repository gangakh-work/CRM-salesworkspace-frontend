import { afterEach, describe, expect, it, vi } from 'vitest'

import { closeAsWonSchema } from '@/features/opportunity-management/domain/win.schema'
import { canMarkAsWon, canTransition } from '@/features/opportunity-management/lib/opportunity-workflow'
import {
  OpportunityWinError,
  OpportunityWinService,
} from '@/features/opportunity-management/services/opportunity-win.service'
import { dvOpportunity, mockDataverse } from '@/test/dataverse-mock'

const validInput = {
  finalRevenue: '520000',
  currency: 'USD',
  contractValue: '520000',
  margin: '32',
  discount: '5',
  decisionMaker: 'Alex Rivera',
  contractStartDate: '2026-08-05',
  contractEndDate: '2027-08-05',
  expectedKickoff: '2026-08-20',
  deliveryOwner: 'Vinay Kumar',
  businessUnit: 'Enterprise Sales',
  confirmed: true,
}

describe('closeAsWonSchema', () => {
  it('accepts valid win input', () => {
    expect(closeAsWonSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects when confirmation is false', () => {
    expect(closeAsWonSchema.safeParse({ ...validInput, confirmed: false }).success).toBe(false)
  })
})

describe('canMarkAsWon', () => {
  it('allows negotiation and contract review only', () => {
    expect(canMarkAsWon('negotiation')).toBe(true)
    expect(canMarkAsWon('legal_review')).toBe(true)
    expect(canMarkAsWon('proposal')).toBe(false)
  })

  it('blocks won via stage transition', () => {
    expect(canTransition('negotiation', 'won')).toBe(false)
    expect(canTransition('legal_review', 'won')).toBe(false)
  })
})

describe('OpportunityWinService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('closes negotiation opportunity as won end-to-end', async () => {
    const opp = dvOpportunity({ stepname: 'Negotiation', estimatedvalue: 500000 })
    const dv = mockDataverse({ opportunities: [opp] })
    const id = String(opp.opportunityid)

    const result = await new OpportunityWinService().closeAsWon(id, validInput, 'Vinay Kumar')

    expect(result.opportunity.status).toBe('won')
    expect(result.opportunity.stage).toBe('won')
    expect(result.opportunity.locked).toBe(true)
    expect(result.opportunity.finalRevenue).toBe(520000)
    expect(result.opportunity.closedBy).toBe('Vinay Kumar')
    expect(result.extras.timeline.some((e) => e.type === 'opportunity_won')).toBe(true)
    // Revenue finalisation and the contract are recorded in Dataverse through the Win
    // action payload (asserted below: final_revenue, actual_end). The older mock-repository
    // code also logged separate 'revenue_finalized'/'contract_created' timeline events.
    expect(result.extras.activities.some((a) => a.subject === 'Win Recorded')).toBe(true)
    expect(result.auditRecord.action).toBe('closed_won')
    // Dataverse contract: the configured Win action with the entered revenue
    const [call] = dv.posts(`/dataverse/opportunities/${id}/win`)
    expect(call.body).toMatchObject({ final_revenue: 520000, actual_end: validInput.contractEndDate })
    expect(dv.opportunities.get(id)?.statecode).toBe(1)
  })

  it('rejects proposal stage', async () => {
    const opp = dvOpportunity({ stepname: 'Proposal' })
    const dv = mockDataverse({ opportunities: [opp] })

    await expect(new OpportunityWinService().closeAsWon(String(opp.opportunityid), validInput, 'Vinay Kumar')).rejects.toBeInstanceOf(
      OpportunityWinError,
    )
    expect(dv.posts('/win')).toHaveLength(0)
  })

  it('rejects already won opportunity', async () => {
    const won = dvOpportunity({ statecode: 1 })
    const dv = mockDataverse({ opportunities: [won] })

    await expect(new OpportunityWinService().closeAsWon(String(won.opportunityid), validInput, 'Vinay Kumar')).rejects.toBeInstanceOf(
      OpportunityWinError,
    )
    expect(dv.posts('/win')).toHaveLength(0)
  })

  it('surfaces a Dataverse failure instead of reporting a win', async () => {
    const opp = dvOpportunity({ stepname: 'Negotiation' })
    const dv = mockDataverse({ opportunities: [opp] })
    dv.failNext('/win', 400, 'WinOpportunity failed: Status Reason is required')

    await expect(new OpportunityWinService().closeAsWon(String(opp.opportunityid), validInput, 'Vinay Kumar')).rejects.toThrow(
      /Status Reason is required/,
    )
    expect(dv.opportunities.get(String(opp.opportunityid))?.statecode).toBe(0)
  })
})
