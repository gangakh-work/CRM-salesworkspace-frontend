import { z } from 'zod'

export const lostReasonSchema = z.enum([
  'price_too_high',
  'lost_to_competitor',
  'budget_cancelled',
  'project_cancelled',
  'no_decision',
  'not_interested',
  'technical_mismatch',
  'timeline_changed',
  'internal_decision',
  'other',
])

const closeAsLostBaseSchema = z.object({
  lostReason: lostReasonSchema,
  competitorName: z.string().trim().max(120).optional(),
  competitorSolution: z.string().trim().max(200).optional(),
  priceDifference: z.string().trim().max(120).optional(),
  lostRemarks: z.string().trim().max(1000).optional(),
  willRevisit: z.enum(['yes', 'no']),
  followUpDate: z.string().trim().optional(),
  followUpOwner: z.string().trim().max(120).optional(),
  confirmed: z.boolean(),
})

export const closeAsLostSchema = closeAsLostBaseSchema.superRefine((data, ctx) => {
  if (data.lostReason === 'lost_to_competitor' && !data.competitorName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Competitor name is required when lost to competitor',
      path: ['competitorName'],
    })
  }
  if (data.willRevisit === 'yes') {
    if (!data.followUpDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Follow-up date is required when revisiting',
        path: ['followUpDate'],
      })
    }
    if (!data.followUpOwner?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Follow-up owner is required when revisiting',
        path: ['followUpOwner'],
      })
    }
  }
  if (!data.confirmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please confirm the lost details',
      path: ['confirmed'],
    })
  }
})

export type CloseAsLostInput = z.infer<typeof closeAsLostBaseSchema>

export const closeAsLostStepSchemas = {
  reason: closeAsLostBaseSchema.pick({ lostReason: true }),
  competitor: closeAsLostBaseSchema.pick({
    competitorName: true,
    competitorSolution: true,
    priceDifference: true,
    lostRemarks: true,
  }),
  followUp: closeAsLostBaseSchema.pick({
    willRevisit: true,
    followUpDate: true,
    followUpOwner: true,
  }),
  review: closeAsLostBaseSchema.pick({ confirmed: true }),
}
