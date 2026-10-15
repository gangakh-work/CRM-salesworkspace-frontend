import { describe, expect, it } from 'vitest'

import { createLeadSchema } from '@/features/lead-management/domain/lead.schema'
import { CREATE_LEAD_DEFAULT_VALUES } from '@/features/lead-management/config/lead-form.config'

const validInput = {
  ...CREATE_LEAD_DEFAULT_VALUES,
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@contoso.com',
  phone: '+1 555 0100',
  title: 'VP Sales',
  companyName: 'Contoso Ltd',
  industry: 'Technology',
  country: 'United States',
  opportunityName: 'Enterprise Platform',
  expectedRevenue: '250000',
  closeDate: '2026-12-31',
  source: 'Website',
  priority: 'high' as const,
}

describe('createLeadSchema', () => {
  it('accepts valid lead input', () => {
    const result = createLeadSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = createLeadSchema.safeParse(CREATE_LEAD_DEFAULT_VALUES)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createLeadSchema.safeParse({ ...validInput, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive expected revenue', () => {
    const result = createLeadSchema.safeParse({ ...validInput, expectedRevenue: '0' })
    expect(result.success).toBe(false)
  })
})
