import { env } from '@/config/env'
import { getAuthToken } from '@/infrastructure/api/client'

export interface Section<T> {
  items: T[]
  error: string | null
}

export interface AccountSummary {
  id: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
  city: string | null
  country: string | null
  industry: string | null
  revenue: number | null
  employees: number | null
  owner: string | null
  primary_contact: string | null
  primary_contact_id: string | null
  active: boolean
  modified: string | null
}

export interface ContactSummary {
  id: string
  name: string
  job_title: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  city: string | null
  country: string | null
  account: string | null
  account_id: string | null
  account_type: string | null
  owner: string | null
  active: boolean
  modified: string | null
}

export interface OpportunityRow {
  id: string
  name: string
  stage: string | null
  value: number | null
  close_date: string | null
  status: string
  owner: string | null
  contact: string | null
}

export interface ActivityRow {
  id: string
  subject: string
  type: string | null
  status: string
  due: string | null
  created: string | null
  owner: string | null
}

export interface DocumentRow {
  id: string
  title: string
  is_file: boolean
  mime: string | null
  created: string | null
}

export interface LeadRow {
  id: string
  name: string
  topic: string | null
  status: string
  owner: string | null
  created: string | null
}

export interface AccountDetail {
  account: AccountSummary & {
    account_number: string | null
    address_line: string | null
    state: string | null
    postal_code: string | null
    description: string | null
    created: string | null
    parent_account: string | null
    parent_account_id: string | null
  }
  summary: { contacts: number; open_opportunities: number; open_pipeline: number; won: number }
  contacts: Section<ContactSummary>
  opportunities: Section<OpportunityRow>
  leads: Section<LeadRow>
  activities: Section<ActivityRow>
  documents: Section<DocumentRow>
  duplicates: Section<AccountSummary & { reasons: string[] }>
}

export interface ContactDetail {
  contact: ContactSummary & {
    first_name: string | null
    last_name: string | null
    department: string | null
    description: string | null
    created: string | null
  }
  summary: { opportunities: number; open_activities: number; documents: number }
  opportunities: Section<OpportunityRow>
  activities: Section<ActivityRow>
  documents: Section<DocumentRow>
  duplicates: Section<ContactSummary & { reasons: string[] }>
}

function headers(email: string): Record<string, string> {
  const token = getAuthToken()
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'X-Sales-User-Email': email }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function call<T>(email: string, path: string): Promise<T> {
  const response = await fetch(`${env.VITE_API_BASE_URL}/crm${path}`, { headers: headers(email) })
  const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: { message?: string } }
  if (!response.ok) {
    throw new ApiError(data.error?.message || data.detail || `Request failed (${response.status})`, response.status)
  }
  return data as T
}

const qs = (p: Record<string, string | boolean | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '' && v !== false)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')

export const crmApi = {
  accounts: (email: string, search: string, includeInactive: boolean) =>
    call<{ items: AccountSummary[]; count: number; limit: number }>(
      email,
      `/accounts?${qs({ search, include_inactive: includeInactive })}`,
    ),
  account: (email: string, id: string) => call<AccountDetail>(email, `/accounts/${id}`),
  contacts: (email: string, search: string, includeInactive: boolean) =>
    call<{ items: ContactSummary[]; count: number; limit: number }>(
      email,
      `/contacts?${qs({ search, include_inactive: includeInactive })}`,
    ),
  contact: (email: string, id: string) => call<ContactDetail>(email, `/contacts/${id}`),
}

/** Downloads a Dataverse note attachment through the existing authenticated endpoint. */
export async function downloadDocument(email: string, id: string, filename: string): Promise<void> {
  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/documents/${id}/download`, { headers: headers(email) })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: { message?: string } }
    throw new Error(data.error?.message || data.detail || `Download failed (${response.status})`)
  }
  const url = URL.createObjectURL(await response.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
