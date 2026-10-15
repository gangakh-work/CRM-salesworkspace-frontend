import { afterEach, describe, expect, it, vi } from 'vitest'

import { transitionStageSchema } from '@/features/opportunity-management/domain/stage.schema'
import { canTransition } from '@/features/opportunity-management/lib/opportunity-workflow'
import {
  OpportunityStageError,
  OpportunityStageService,
} from '@/features/opportunity-management/services/opportunity-stage.service'
import { dvOpportunity, mockDataverse } from '@/test/dataverse-mock'

describe('transitionStageSchema', () => {
  it('accepts valid transition input', () => {
    const result = transitionStageSchema.safeParse({
      opportunityId: 'opp-001',
      targetStage: 'negotiation',
      transitionedBy: 'Vinay Kumar',
    })
    expect(result.success).toBe(true)
  })
})

describe('canTransition', () => {
  it('allows sequential forward and backward moves', () => {
    expect(canTransition('prospect', 'qualification')).toBe(true)
    expect(canTransition('qualification', 'prospect')).toBe(true)
  })

  it('blocks closed stage transitions', () => {
    expect(canTransition('won', 'prospect')).toBe(false)
    expect(canTransition('lost', 'qualification')).toBe(false)
    expect(canTransition('won', 'lost')).toBe(false)
    expect(canTransition('lost', 'won')).toBe(false)
  })

  it('allows admin to skip mandatory stages', () => {
    expect(canTransition('prospect', 'discovery', { isAdmin: false })).toBe(false)
    expect(canTransition('prospect', 'discovery', { isAdmin: true })).toBe(true)
  })

  it('blocks lost from any stage via transition', () => {
    expect(canTransition('negotiation', 'lost')).toBe(false)
  })
})

describe('OpportunityStageService', () => {
  afterEach(() => vi.restoreAllMocks())
  const service = () => new OpportunityStageService()

  it('transitions stage with timeline, activity, and audit records', async () => {
    const opp = dvOpportunity({ stepname: 'Discovery' })
    const dv = mockDataverse({ opportunities: [opp] })

    const result = await service().transitionStage({
      opportunityId: String(opp.opportunityid),
      targetStage: 'proposal',
      transitionedBy: 'Vinay Kumar',
    })

    expect(result.fromStage).toBe('discovery')
    expect(result.toStage).toBe('proposal')
    expect(result.opportunity.stage).toBe('proposal')
    expect(result.opportunity.previousStage).toBe('discovery')
    expect(result.opportunity.stageUpdatedBy).toBe('Vinay Kumar')
    expect(result.extras.stageHistory).toHaveLength(1)
    expect(result.extras.auditRecords).toHaveLength(1)
    expect(result.extras.timeline.some((e) => e.type === 'stage_changed')).toBe(true)
    expect(result.extras.activities.some((a) => a.status === 'completed')).toBe(true)
    // persisted in Dataverse
    const patch = dv.calls.find((c) => c.method === 'patch')!
    expect((patch.body as { stepname: string }).stepname).toMatch(/proposal/i)
    expect(String(dv.opportunities.get(String(opp.opportunityid))?.stepname)).toMatch(/proposal/i)
  })

  it('moves to next and previous stage', async () => {
    const opp = dvOpportunity({ stepname: 'Qualification' })
    const dv = mockDataverse({ opportunities: [opp] })
    const id = String(opp.opportunityid)

    await service().moveToNextStage(id, 'Vinay Kumar')
    expect(String(dv.opportunities.get(id)?.stepname)).toMatch(/discover/i)

    await service().moveToPreviousStage(id, 'Vinay Kumar')
    expect(String(dv.opportunities.get(id)?.stepname)).toMatch(/qualif/i)
  })

  it('marks opportunity on hold and resumes', async () => {
    const opp = dvOpportunity({ stepname: 'Proposal' })
    mockDataverse({ opportunities: [opp] })
    const id = String(opp.opportunityid)

    const onHold = await service().setOnHold({ opportunityId: id, onHold: true, updatedBy: 'Vinay Kumar' })
    expect(onHold.opportunity.onHold).toBe(true)

    const resumed = await service().setOnHold({ opportunityId: id, onHold: false, updatedBy: 'Vinay Kumar' })
    expect(resumed.opportunity.onHold).toBe(false)
  })

  it('assigns owner with audit trail', async () => {
    const opp = dvOpportunity()
    const dv = mockDataverse({ opportunities: [opp] })

    const result = await service().assignOwner({
      opportunityId: String(opp.opportunityid),
      owner: 'Sarah Chen',
      assignedBy: 'Vinay Kumar',
    })

    expect(result.opportunity.owner).toBe('Sarah Chen')
    expect(result.extras.auditRecords.some((a) => a.action === 'owner_assigned')).toBe(true)
    expect(dv.calls.find((c) => c.method === 'patch')?.body).toEqual({ owner_name: 'Sarah Chen' })
  })

  it('duplicates opportunity at prospect stage', async () => {
    const source = dvOpportunity({ stepname: 'Negotiation', name: 'Big Deal' })
    const dv = mockDataverse({ opportunities: [source] })
    const before = dv.opportunities.size

    const result = await service().duplicateOpportunity(String(source.opportunityid), 'Vinay Kumar')

    expect(dv.opportunities.size).toBe(before + 1)
    expect(result.opportunity.stage).toBe('prospect')
    expect(result.opportunity.name).toContain('(Copy)')
  })

  it('rejects invalid transitions', async () => {
    const won = dvOpportunity({ statecode: 1, stepname: 'Close' })
    const dv = mockDataverse({ opportunities: [won] })

    await expect(
      service().transitionStage({ opportunityId: String(won.opportunityid), targetStage: 'prospect', transitionedBy: 'Vinay Kumar' }),
    ).rejects.toBeInstanceOf(OpportunityStageError)
    expect(dv.calls.filter((c) => c.method === 'patch')).toHaveLength(0)
  })

  it('blocks stage change while on hold', async () => {
    const opp = dvOpportunity({ stepname: 'Proposal' })
    const dv = mockDataverse({ opportunities: [opp] })
    const id = String(opp.opportunityid)

    await service().setOnHold({ opportunityId: id, onHold: true, updatedBy: 'Vinay Kumar' })
    const patchesBefore = dv.calls.filter((c) => c.method === 'patch').length
    await expect(
      service().transitionStage({ opportunityId: id, targetStage: 'commercial_review', transitionedBy: 'Vinay Kumar' }),
    ).rejects.toBeInstanceOf(OpportunityStageError)
    expect(dv.calls.filter((c) => c.method === 'patch')).toHaveLength(patchesBefore)
  })
})
