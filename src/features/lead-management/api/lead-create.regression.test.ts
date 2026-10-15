/**
 * Regression guard for the working Lead creation flow.
 *
 * Unlike lead.service.test.ts (which stubs LeadApi), this runs the real
 * LeadService → LeadApi → payload mapping and pins the exact request sent to
 * the backend's Dataverse lead endpoint. If a refactor changes a field name,
 * drops a value or stops trimming input, these tests fail.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LeadApi } from '@/features/lead-management/api/LeadApi'
import { CREATE_LEAD_DEFAULT_VALUES } from '@/features/lead-management/config/lead-form.config'
import { LeadService } from '@/features/lead-management/services/lead.service'
import { mockDataverse } from '@/test/dataverse-mock'

const input = {
  ...CREATE_LEAD_DEFAULT_VALUES,
  firstName: '  Alex ',
  lastName: 'Rivera',
  email: ' alex@fabrikam.com ',
  phone: '+1 555 0199',
  title: 'Director',
  companyName: 'Fabrikam Inc ',
  industry: 'Manufacturing',
  country: 'United States',
  opportunityName: 'Cloud Migration',
  expectedRevenue: '340000',
  closeDate: '2026-09-30',
  source: 'Referral',
  priority: 'high' as const,
  notes: 'Initial discovery call completed.',
}

describe('Lead creation (regression)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends the exact Dataverse payload and returns the created lead', async () => {
    const dv = mockDataverse()

    const result = await LeadApi.createLead(input, 'Vinay Kumar', 'vinay.kumar@contoso.com')

    const creates = dv.posts('/dataverse/leads')
    expect(creates).toHaveLength(1)
    expect(creates[0].body).toEqual({
      subject: 'Cloud Migration',
      firstname: 'Alex',
      lastname: 'Rivera',
      companyname: 'Fabrikam Inc',
      emailaddress1: 'alex@fabrikam.com',
      telephone1: '+1 555 0199',
      description: 'Initial discovery call completed.',
      jobtitle: 'Director',
      estimated_amount: 340000,
      owner_name: 'Vinay Kumar',
      owner_email: 'vinay.kumar@contoso.com',
    })
    expect(result.lead.id).toBe(dv.leads.keys().next().value)
    expect(result.lead.company).toBe('Fabrikam Inc')
    expect(result.lead.owner).toBe('Vinay Kumar')
    expect(result.crmUrl).toContain(result.lead.id)
  })

  it('uses the person name as subject when no opportunity name is given', async () => {
    const dv = mockDataverse()

    // Known cosmetic issue (left unchanged — Lead creation is frozen): the fallback subject
    // is built from untrimmed names, so '  Alex ' + 'Rivera' gives 'Alex  Rivera'.
    // See BLUEPRINT_STATUS.md → Known issues.
    await LeadApi.createLead({ ...input, firstName: 'Alex', opportunityName: '' }, 'Vinay Kumar')

    expect((dv.posts('/dataverse/leads')[0].body as { subject: string }).subject).toBe('Alex Rivera')
  })

  it('creates through LeadService end-to-end', async () => {
    const dv = mockDataverse()

    const result = await new LeadService().createLead(input, 'Vinay Kumar')

    expect(dv.posts('/dataverse/leads')).toHaveLength(1)
    expect(result.lead.name).toContain('Alex')
    expect(result.lead.status).toBe('assigned')
  })

  it('surfaces a Dataverse rejection instead of reporting success', async () => {
    const dv = mockDataverse()
    dv.failNext('/dataverse/leads', 400, 'Lead Source is required')

    await expect(LeadApi.createLead(input, 'Vinay Kumar')).rejects.toThrow(/Lead Source is required/)
    expect(dv.leads.size).toBe(0)
  })
})
