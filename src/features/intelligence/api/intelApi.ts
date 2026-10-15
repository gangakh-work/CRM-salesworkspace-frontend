import { env } from '@/config/env'
import { getAuthToken } from '@/infrastructure/api/client'

/* ── Types (mirror backend app/intelligence) ───────────────────────────── */

export interface Evidence {
  field: string
  value: string | number
}

export interface ActionRef {
  id: 'complete' | 'reschedule' | 'snooze' | 'dismiss' | 'open' | 'prompt'
  label: string
  href?: string
  prompt?: string
}

export interface WorkflowAction {
  key: string
  type: 'task' | 'meeting' | 'deal' | 'lead'
  title: string
  reason: string
  reasons: string[]
  score: number
  priority: 'high' | 'medium' | 'low' | null
  priority_label: string
  due_date: string | null
  record: { kind: string; id: string; name: string; href?: string; regarding?: string | null; regarding_id?: string | null }
  views: string[]
  evidence: Evidence[]
  source: string
  primary_action: ActionRef | null
  secondary_actions: ActionRef[]
  fingerprint: string
}

export interface WorkflowResponse {
  view: string
  views: { id: string; label: string; count: number }[]
  actions: WorkflowAction[]
  hidden: number
  generated_at: string
  ranking: string
}

export interface Insight {
  rule: string
  severity: 'high' | 'medium' | 'low' | 'info'
  title: string
  explanation: string
  evidence: Evidence[]
  source: string
  evaluated_at: string
  suggested_action: { label: string; href?: string; prompt?: string }
}

export interface DealIntel {
  id: string
  name: string
  href: string
  customer: string
  owner: string
  stage: string
  value: number | null
  close_date: string | null
  severity: 'high' | 'medium' | 'low' | 'ok'
  insights: Insight[]
}

export interface TeamRow {
  owner: string
  open: number
  value: number
  overdue_close: number
  no_next_step: number
  stale: number
  large: number
  overdue_tasks: number
}

export interface DealsResponse {
  deals: DealIntel[]
  not_evaluated: { rule: string; reason: string }[]
  generated_at: string
  scope: 'mine' | 'team'
  team?: TeamRow[]
  can_view_team: boolean
}

export interface AnalyticsResponse {
  period: { start: string; end: string }
  scope: 'mine' | 'team'
  owner: string | null
  owners: string[]
  can_view_team: boolean
  kpis: {
    open_pipeline: number
    open_count: number
    weighted_pipeline: number
    without_probability: number
    won_count: number
    won_value: number
    lost_count: number
    lost_value: number
    win_rate: number | null
    sales_cycle_days: number | null
    task_completion: number | null
    tasks_in_period: number
    overdue_tasks: number
  }
  stages: { stage: string; count: number; value: number }[]
  aging: { bucket: string; count: number }[]
  forecast: { month: string; count: number; pipeline: number; weighted: number; won: number }[]
  definitions: Record<string, string>
  assumptions: string[]
  generated_at: string
  record_counts: { opportunities: number; tasks: number }
}

export interface SystemStatus {
  checked_at: string
  integrations: { id: string; name: string; status: string; detail: string; latency_ms?: number; error?: string }[]
}

export interface AuditItem {
  id: number
  at: string
  actor: string
  event: string
  summary: string
}

/* ── Client ────────────────────────────────────────────────────────────── */

async function call<T>(email: string, name: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const sep = path.includes('?') ? '&' : '?'
  const response = await fetch(`${env.VITE_API_BASE_URL}/intel${path}${sep}user_name=${encodeURIComponent(name)}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Sales-User-Email': email,
      ...(init.headers ?? {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: { message?: string } }
  // The API's global error handler returns { error: { message } }; plain FastAPI returns { detail }.
  if (!response.ok) throw new Error(data.error?.message || data.detail || `Request failed (${response.status})`)
  return data as T
}

export const intelApi = {
  workflow: (email: string, name: string, view: string) =>
    call<WorkflowResponse>(email, name, `/workflow?view=${view}`),
  setState: (email: string, name: string, body: { key: string; status: string; until?: string; fingerprint?: string }) =>
    call<{ ok: boolean }>(email, name, '/workflow/state', { method: 'POST', body: JSON.stringify(body) }),
  completeTask: (email: string, name: string, id: string) =>
    call<{ verified: boolean }>(email, name, `/tasks/${id}/complete`, { method: 'POST' }),
  rescheduleTask: (email: string, name: string, id: string, due_date: string) =>
    call<{ verified: boolean; due_date: string }>(email, name, `/tasks/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ due_date }),
    }),
  deals: (email: string, name: string, team: boolean) => call<DealsResponse>(email, name, `/deals?team=${team}`),
  analytics: (email: string, name: string, q: { start: string; end: string; scope: string; owner?: string }) =>
    call<AnalyticsResponse>(
      email,
      name,
      `/analytics?start=${q.start}&end=${q.end}&scope=${q.scope}${q.owner ? `&owner=${encodeURIComponent(q.owner)}` : ''}`,
    ),
  system: (email: string, name: string) => call<SystemStatus>(email, name, '/system'),
  audit: (email: string, name: string) => call<AuditItem[]>(email, name, '/audit?limit=200'),
}
