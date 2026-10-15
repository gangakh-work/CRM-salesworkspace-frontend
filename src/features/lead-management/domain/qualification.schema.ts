import { z } from 'zod'

const yesNoSchema = z.enum(['yes', 'no'], {
  required_error: 'Please select Yes or No',
})

export const qualifyLeadSchema = z.object({
  productsInterested: z.string().trim().min(1, 'Products interested is required').max(500),
  expectedRevenue: z
    .string()
    .trim()
    .min(1, 'Expected revenue is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: 'Expected revenue must be a positive number',
    }),
  priority: z.enum(['high', 'medium', 'low']),
  budgetRange: z.string().trim().min(1, 'Budget range is required'),
  buyingTimeline: z.string().trim().min(1, 'Buying timeline is required'),
  decisionMaker: z.string().trim().min(1, 'Decision maker is required').max(120),
  competitors: z.string().trim().optional(),
  needConfirmed: yesNoSchema,
  budgetConfirmed: yesNoSchema,
  authorityConfirmed: yesNoSchema,
  timelineConfirmed: yesNoSchema,
  painPoints: z.string().trim().min(1, 'Pain points are required').max(1000),
})

export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>

export const qualifyLeadStepSchemas = {
  interest: qualifyLeadSchema.pick({
    productsInterested: true,
    expectedRevenue: true,
    priority: true,
  }),
  budget: qualifyLeadSchema.pick({
    budgetRange: true,
    buyingTimeline: true,
    decisionMaker: true,
    competitors: true,
  }),
  questions: qualifyLeadSchema.pick({
    needConfirmed: true,
    budgetConfirmed: true,
    authorityConfirmed: true,
    timelineConfirmed: true,
    painPoints: true,
  }),
}
