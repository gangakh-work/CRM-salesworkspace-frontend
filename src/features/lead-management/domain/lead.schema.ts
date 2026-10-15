import { z } from 'zod'

export const createLeadSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email required'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone must be at least 7 characters')
    .max(30, 'Phone is too long'),
  title: z.string().trim().min(1, 'Job title is required').max(120),
  companyName: z.string().trim().min(1, 'Company name is required').max(160),
  industry: z.string().trim().min(1, 'Industry is required'),
  country: z.string().trim().min(1, 'Country is required'),
  website: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v) || /^[\w.-]+\.\w{2,}$/i.test(v), {
      message: 'Enter a valid website URL',
    }),
  employees: z.string().trim().optional(),
  opportunityName: z.string().trim().min(1, 'Opportunity name is required').max(200),
  expectedRevenue: z
    .string()
    .trim()
    .min(1, 'Expected revenue is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: 'Expected revenue must be a positive number',
    }),
  budget: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Budget must be a valid number',
    }),
  closeDate: z
    .string()
    .trim()
    .min(1, 'Close date is required')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid close date' }),
  source: z.string().trim().min(1, 'Lead source is required'),
  priority: z.enum(['high', 'medium', 'low']),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const createLeadStepSchemas = {
  customer: createLeadSchema.pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    title: true,
  }),
  company: createLeadSchema.pick({
    companyName: true,
    industry: true,
    country: true,
    website: true,
    employees: true,
  }),
  opportunity: createLeadSchema.pick({
    opportunityName: true,
    expectedRevenue: true,
    budget: true,
    closeDate: true,
  }),
  additional: createLeadSchema.pick({
    source: true,
    priority: true,
    description: true,
    notes: true,
  }),
}
