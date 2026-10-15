import { z } from 'zod'

import { OPEN_STAGE_ORDER } from '@/features/opportunity-management/lib/opportunity-workflow'

export const opportunityStageSchema = z.enum([
  'prospect',
  'qualification',
  'discovery',
  'proposal',
  'commercial_review',
  'negotiation',
  'legal_review',
  'won',
  'lost',
])

export const transitionStageSchema = z.object({
  opportunityId: z.string().min(1),
  targetStage: opportunityStageSchema,
  transitionedBy: z.string().min(1),
  isAdmin: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
})

export const assignOwnerSchema = z.object({
  opportunityId: z.string().min(1),
  owner: z.string().trim().min(1),
  assignedBy: z.string().min(1),
})

export const onHoldSchema = z.object({
  opportunityId: z.string().min(1),
  onHold: z.boolean(),
  updatedBy: z.string().min(1),
})

export type TransitionStageInput = z.infer<typeof transitionStageSchema>
export type AssignOwnerInput = z.infer<typeof assignOwnerSchema>
export type OnHoldInput = z.infer<typeof onHoldSchema>

export const OPEN_STAGES = OPEN_STAGE_ORDER
