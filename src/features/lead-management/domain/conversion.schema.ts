import { z } from 'zod'

const revenueString = z
  .string()
  .trim()
  .min(1, 'Revenue is required')
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
    message: 'Revenue must be a positive number',
  })

const marginString = z
  .string()
  .trim()
  .min(1, 'Expected margin is required')
  .refine((v) => {
    const n = Number(v)
    return !Number.isNaN(n) && n >= 0 && n <= 100
  }, { message: 'Margin must be between 0 and 100' })

export const opportunityStageSchema = z.enum([
  'prospect',
  'qualification',
  'discovery',
  'proposal',
  'negotiation',
  'legal_review',
  'won',
  'lost',
])

export const forecastCategorySchema = z.enum([
  'pipeline',
  'best_case',
  'commit',
  'closed',
  'omitted',
])

const convertLeadBaseSchema = z.object({
  opportunityName: z.string().trim().min(1, 'Opportunity name is required').max(200),
  customer: z.string().trim().min(1, 'Customer is required').max(200),
  primaryContact: z.string().trim().min(1, 'Primary contact is required').max(120),
  expectedRevenue: revenueString,
  estimatedCloseDate: z.string().trim().min(1, 'Estimated close date is required'),
  salesStage: opportunityStageSchema,
  forecastCategory: forecastCategorySchema,
  probability: z
    .string()
    .trim()
    .min(1, 'Probability is required')
    .refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= 0 && n <= 100
    }, { message: 'Probability must be between 0 and 100' }),
  region: z.string().trim().min(1, 'Region is required'),
  businessUnit: z.string().trim().min(1, 'Business unit is required'),
  industry: z.string().trim().min(1, 'Industry is required'),
  currency: z.string().trim().min(1, 'Currency is required'),
  estimatedRevenue: revenueString,
  expectedMargin: marginString,
  priority: z.enum(['high', 'medium', 'low']),
  confirmed: z.boolean(),
})

export const convertLeadSchema = convertLeadBaseSchema.superRefine((data, ctx) => {
  if (!data.confirmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please confirm the conversion details',
      path: ['confirmed'],
    })
  }
})

export type ConvertLeadInput = z.infer<typeof convertLeadBaseSchema>

export const convertLeadStepSchemas = {
  basics: convertLeadBaseSchema.pick({
    opportunityName: true,
    customer: true,
    primaryContact: true,
    expectedRevenue: true,
    estimatedCloseDate: true,
  }),
  details: convertLeadBaseSchema.pick({
    salesStage: true,
    forecastCategory: true,
    probability: true,
    region: true,
    businessUnit: true,
    industry: true,
  }),
  commercial: convertLeadBaseSchema.pick({
    currency: true,
    estimatedRevenue: true,
    expectedMargin: true,
    priority: true,
  }),
  review: convertLeadBaseSchema.pick({ confirmed: true }),
}
