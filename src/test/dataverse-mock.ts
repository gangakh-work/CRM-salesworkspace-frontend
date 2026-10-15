/**
 * Test harness: a stateful fake of the backend's Dataverse endpoints, mounted
 * at the `apiClient` (axios) boundary. Services, LeadApi/OpportunityApi and the
 * Dataverse→domain mappers all run for real; only the HTTP round-trip is faked.
 * Every request is recorded in `calls` so tests can assert exact payloads.
 */
import { vi } from 'vitest'

import { apiClient } from '@/infrastructure/api/client'

const FV = '@OData.Community.Display.V1.FormattedValue'
type Rec = Record<string, unknown>

let seq = 0
export const guid = (n = ++seq) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`

/** A Dataverse lead record. statuscode: 1 New · 2 Contacted · 3 Qualified; statecode 1 qualified · 2 disqualified. */
export function dvLead(overrides: Rec = {}): Rec {
  const id = (overrides.leadid as string) ?? guid()
  return {
    leadid: id,
    fullname: 'Jane Smith',
    firstname: 'Jane',
    lastname: 'Smith',
    companyname: 'Contoso Ltd',
    emailaddress1: 'jane@contoso.com',
    telephone1: '+44 20 1234 5678',
    jobtitle: 'VP Operations',
    statecode: 0,
    statuscode: 2,
    [`statuscode${FV}`]: 'Contacted',
    createdon: '2026-09-01T10:00:00Z',
    modifiedon: '2026-10-01T10:00:00Z',
    _ownerid_value: guid(9001),
    [`_ownerid_value${FV}`]: 'Vinay Kumar',
    ...overrides,
  }
}

/** A Dataverse opportunity record (statecode 0 open · 1 won · 2 lost). */
export function dvOpportunity(overrides: Rec = {}): Rec {
  const id = (overrides.opportunityid as string) ?? guid()
  return {
    opportunityid: id,
    name: 'Contoso — Enterprise Deal',
    estimatedvalue: 250000,
    closeprobability: 40,
    estimatedclosedate: '2026-12-31',
    stepname: 'Discovery',
    statecode: 0,
    statuscode: 1,
    description: '',
    createdon: '2026-09-01T10:00:00Z',
    modifiedon: '2026-10-01T10:00:00Z',
    _customerid_value: guid(9002),
    [`_customerid_value${FV}`]: 'Contoso Ltd',
    _parentcontactid_value: guid(9003),
    [`_parentcontactid_value${FV}`]: 'Jane Smith',
    _ownerid_value: guid(9001),
    [`_ownerid_value${FV}`]: 'Vinay Kumar',
    ...overrides,
  }
}

export interface RecordedCall {
  method: 'get' | 'post' | 'patch' | 'delete'
  url: string
  body?: unknown
}

export function mockDataverse(seed: { leads?: Rec[]; opportunities?: Rec[] } = {}) {
  const leads = new Map((seed.leads ?? []).map((l) => [String(l.leadid), { ...l }]))
  const opportunities = new Map((seed.opportunities ?? []).map((o) => [String(o.opportunityid), { ...o }]))
  const calls: RecordedCall[] = []
  /** Make the next request to a URL fail like Dataverse would. */
  const failures = new Map<string, { status: number; message: string }>()

  const reply = (data: unknown) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config: {} })
  const fail = (url: string) => {
    const f = [...failures.entries()].find(([pattern]) => url.includes(pattern))
    if (!f) return null
    failures.delete(f[0])
    const err = Object.assign(new Error(f[1].message), {
      isAxiosError: true,
      response: { status: f[1].status, data: { success: false, error: { message: f[1].message } } },
    })
    return Promise.reject(err)
  }
  const notFound = (url: string) =>
    Promise.reject(
      Object.assign(new Error('Not found'), {
        isAxiosError: true,
        response: { status: 404, data: { success: false, error: { message: `Not found: ${url}` } } },
      }),
    )

  vi.spyOn(apiClient, 'get').mockImplementation(((url: string) => {
    calls.push({ method: 'get', url })
    const failed = fail(url)
    if (failed) return failed
    let m: RegExpMatchArray | null
    if (url === '/dataverse/leads') return reply({ value: [...leads.values()] })
    if ((m = url.match(/^\/dataverse\/leads\/([^/]+)$/))) return leads.has(m[1]) ? reply(leads.get(m[1])) : notFound(url)
    if (url === '/dataverse/opportunities') return reply({ value: [...opportunities.values()] })
    if ((m = url.match(/^\/dataverse\/opportunities\/([^/]+)$/)))
      return opportunities.has(m[1]) ? reply(opportunities.get(m[1])) : notFound(url)
    if (/^\/dataverse\/opportunities\/[^/]+\/(notes|documents)$/.test(url)) return reply({ value: [] })
    if (/^\/dataverse\/opportunities\/[^/]+\/activities$/.test(url)) return reply({ tasks: [], appointments: [] })
    return notFound(url)
  }) as typeof apiClient.get)

  vi.spyOn(apiClient, 'post').mockImplementation(((url: string, body?: unknown) => {
    calls.push({ method: 'post', url, body })
    const failed = fail(url)
    if (failed) return failed
    const b = (body ?? {}) as Rec
    let m: RegExpMatchArray | null
    if ((m = url.match(/^\/dataverse\/leads\/([^/]+)\/qualify$/))) {
      const lead = leads.get(m[1])
      if (!lead) return notFound(url)
      Object.assign(lead, { statecode: 1, statuscode: 3, [`statuscode${FV}`]: 'Qualified' })
      return reply({ lead_id: m[1] })
    }
    if ((m = url.match(/^\/dataverse\/leads\/([^/]+)\/disqualify$/))) {
      const lead = leads.get(m[1])
      if (!lead) return notFound(url)
      Object.assign(lead, { statecode: 2, statuscode: 4, [`statuscode${FV}`]: 'Lost' })
      return reply({ lead_id: m[1], reason: b.reason })
    }
    if (url === '/dataverse/leads') {
      const created = dvLead({ fullname: `${b.firstname ?? ''} ${b.lastname ?? ''}`.trim(), ...b, statuscode: 1 })
      leads.set(String(created.leadid), created)
      // Shape of the backend's CreateLeadResult
      return reply({
        success: true,
        data: {
          lead_id: created.leadid,
          fullname: created.fullname,
          company: created.companyname,
          subject: created.subject,
          crm_url: `https://org.crm.dynamics.com/main.aspx?etn=lead&id=${created.leadid}`,
        },
      })
    }
    if (url === '/dataverse/opportunities') {
      // Like the backend: the lead link comes back as _originatingleadid_value,
      // the customer as a formatted lookup.
      const { lead_id, customer_name, owner_name, owner_email: _oe, ...fields } = b
      void _oe
      const created = dvOpportunity({
        stepname: null, // Dataverse leaves the stage empty unless it is set explicitly
        ...fields,
        opportunityid: guid(),
        ...(lead_id ? { _originatingleadid_value: lead_id } : {}),
        ...(customer_name ? { [`_customerid_value${FV}`]: customer_name } : {}),
        ...(owner_name ? { [`_ownerid_value${FV}`]: owner_name } : {}),
      })
      opportunities.set(String(created.opportunityid), created)
      return reply(created)
    }
    if ((m = url.match(/^\/dataverse\/opportunities\/([^/]+)\/(win|lose)$/))) {
      const opp = opportunities.get(m[1])
      if (!opp) return notFound(url)
      Object.assign(opp, m[2] === 'win'
        ? { statecode: 1, statuscode: 3, actualvalue: b.final_revenue ?? opp.estimatedvalue, actualclosedate: '2026-10-11' }
        : { statecode: 2, statuscode: 4, actualclosedate: '2026-10-11' })
      return reply({ ok: true })
    }
    if (/^\/dataverse\/opportunities\/[^/]+\/(notes|activities)$/.test(url)) return reply({ ok: true })
    return notFound(url)
  }) as typeof apiClient.post)

  vi.spyOn(apiClient, 'patch').mockImplementation(((url: string, body?: unknown) => {
    calls.push({ method: 'patch', url, body })
    const failed = fail(url)
    if (failed) return failed
    const m = url.match(/^\/dataverse\/(leads|opportunities)\/([^/]+)$/)
    const table = m?.[1] === 'leads' ? leads : opportunities
    const record = m ? table.get(m[2]) : undefined
    if (!record) return notFound(url)
    // Mirror the backend: owner_name resolves to the owner lookup; on_hold is stored
    // as a marker in the description (see backend apply_on_hold_marker).
    const { owner_name, on_hold, ...fields } = (body ?? {}) as Rec
    Object.assign(record, fields)
    if (owner_name) record[`_ownerid_value${FV}`] = owner_name
    if (on_hold !== undefined) {
      const desc = String(record.description ?? '').replace(/\n?<!--sales-workspace:on_hold=(true|false)-->/i, '')
      record.description = `${desc}\n<!--sales-workspace:on_hold=${on_hold ? 'true' : 'false'}-->`
    }
    return reply(record)
  }) as typeof apiClient.patch)

  vi.spyOn(apiClient, 'delete').mockImplementation(((url: string) => {
    calls.push({ method: 'delete', url })
    const m = url.match(/^\/dataverse\/(leads|opportunities)\/([^/]+)$/)
    if (m) (m[1] === 'leads' ? leads : opportunities).delete(m[2])
    return reply({})
  }) as typeof apiClient.delete)

  return {
    leads,
    opportunities,
    calls,
    failNext: (urlPart: string, status = 400, message = 'Dataverse rejected the request') =>
      failures.set(urlPart, { status, message }),
    posts: (urlPart: string) => calls.filter((c) => c.method === 'post' && c.url.includes(urlPart)),
  }
}
