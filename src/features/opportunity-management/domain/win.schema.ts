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
  .min(1, 'Margin is required')
  .refine((v) => {
    const n = Number(v)
    return !Number.isNaN(n) && n >= 0 && n <= 100
  }, { message: 'Margin must be between 0 and 100' })

const discountString = z
  .string()
  .trim()
  .min(1, 'Discount is required')
  .refine((v) => {
    const n = Number(v)
    return !Number.isNaN(n) && n >= 0 && n <= 100
  }, { message: 'Discount must be between 0 and 100' })

const closeAsWonBaseSchema = z.object({
  finalRevenue: revenueString,
  currency: z.string().trim().min(1, 'Currency is required'),
  contractValue: revenueString,
  margin: marginString,
  discount: discountString,
  decisionMaker: z.string().trim().min(1, 'Decision maker is required').max(120),
  contractStartDate: z.string().trim().min(1, 'Contract start date is required'),
  contractEndDate: z.string().trim().min(1, 'Contract end date is required'),
  expectedKickoff: z.string().trim().min(1, 'Expected kickoff date is required'),
  deliveryOwner: z.string().trim().min(1, 'Delivery owner is required').max(120),
  businessUnit: z.string().trim().min(1, 'Business unit is required'),
  confirmed: z.boolean(),
})

export const closeAsWonSchema = closeAsWonBaseSchema.superRefine((data, ctx) => {
  if (data.contractEndDate < data.contractStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Contract end date must be on or after start date',
      path: ['contractEndDate'],
    })
  }
  if (!data.confirmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please confirm the win details',
      path: ['confirmed'],
    })
  }
})

export type CloseAsWonInput = z.infer<typeof closeAsWonBaseSchema>

export const closeAsWonStepSchemas = {
  revenue: closeAsWonBaseSchema.pick({
    finalRevenue: true,
    currency: true,
    contractValue: true,
    margin: true,
    discount: true,
  }),
  customer: closeAsWonBaseSchema.pick({
    decisionMaker: true,
    contractStartDate: true,
    contractEndDate: true,
  }),
  implementation: closeAsWonBaseSchema.pick({
    expectedKickoff: true,
    deliveryOwner: true,
    businessUnit: true,
  }),
  review: closeAsWonBaseSchema.pick({ confirmed: true }),
}
