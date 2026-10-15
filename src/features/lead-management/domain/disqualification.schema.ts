import { z } from 'zod'

export const disqualificationReasonSchema = z.enum([
  'budget_constraints',
  'no_business_need',
  'lost_to_competitor',
  'duplicate_lead',
  'invalid_contact',
  'no_response',
  'project_cancelled',
  'other',
])

export const revisitAfterDaysSchema = z.enum(['30', '60', '90', '180'])

const disqualifyLeadBaseSchema = z.object({
  reason: disqualificationReasonSchema,
  competitorName: z.string().trim().optional(),
  remarks: z.string().trim().max(1000).optional(),
  scheduleFollowUp: z.boolean(),
  revisitAfterDays: revisitAfterDaysSchema.optional(),
  followUpOwner: z.string().trim().optional(),
})

export const disqualifyLeadSchema = disqualifyLeadBaseSchema.superRefine((data, ctx) => {
  if (data.scheduleFollowUp) {
    if (!data.revisitAfterDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select when to revisit this lead',
        path: ['revisitAfterDays'],
      })
    }
    if (!data.followUpOwner?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Follow-up owner is required',
        path: ['followUpOwner'],
      })
    }
  }
})

export type DisqualifyLeadInput = z.infer<typeof disqualifyLeadBaseSchema>

export const disqualifyLeadStepSchemas = {
  reason: disqualifyLeadBaseSchema.pick({ reason: true }),
  competitor: disqualifyLeadBaseSchema.pick({
    competitorName: true,
    remarks: true,
  }),
  followUp: disqualifyLeadBaseSchema.pick({
    scheduleFollowUp: true,
    revisitAfterDays: true,
    followUpOwner: true,
  }),
}
