import { env } from '@/config/env'
import { getAuthToken } from '@/infrastructure/api/client'

/* ── Types (mirror app/autopilot on the backend) ───────────────────────── */

export interface AgentProfile {
  owner_email: string
  owner_name: string
  persona_name: string
  enabled: boolean
  mode: 'approval' | 'autopilot'
  approve_first_touch: boolean
  daily_email_limit: number
  work_start_hour: number
  work_end_hour: number
  work_days: string
  timezone: string
  tone: string
  signature: string
  value_proposition: string
  meeting_minutes: number
}

export interface AgentOverview {
  profile: AgentProfile
  delivery: { mode: 'dry_run' | 'graph'; ready: boolean; detail: string }
  working_now: boolean
  kpis: {
    pending_approval: number
    queued: number
    sent_today: number
    daily_limit: number
    sent_7d: number
    replies_7d: number
    reply_rate_7d: number
    meetings_30d: number
    active_prospects: number
    failed: number
  }
}

export interface CampaignStep {
  day: number
  channel: 'email'
  instructions: string
}

export interface Campaign {
  id: number
  name: string
  goal: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  audience: { statuses: string[]; industries: string[]; mine_only: boolean; max_leads: number }
  steps: CampaignStep[]
  created_at: string | null
  stats: { enrolled: number; sent: number; replied: number; meetings: number; active: number; reply_rate: number }
}

export type ActionStatus =
  | 'pending_approval'
  | 'approved'
  | 'executing'
  | 'done'
  | 'failed'
  | 'rejected'
  | 'skipped'

export interface AgentAction {
  id: number
  kind: 'send_email' | 'reply_email' | 'schedule_meeting' | 'review_reply'
  status: ActionStatus
  title: string
  reason: string
  payload: {
    to?: string
    subject?: string
    body?: string
    preview?: string
    slots?: string[]
    start?: string
    minutes?: number
    draft_source?: string
  }
  result: { simulated?: boolean; join_url?: string; web_link?: string; start?: string }
  error: string
  attempts: number
  created_at: string | null
  executed_at: string | null
  lead: { id: string; name: string; email: string; company: string; status: string; intent: string | null } | null
}

export interface AuditItem {
  id: number
  at: string
  actor: 'agent' | 'user' | 'system'
  event: string
  summary: string
}

/* ── Client ────────────────────────────────────────────────────────────── */

const BASE = () => `${env.VITE_API_BASE_URL}/ai/autopilot`

async function call<T>(email: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Production (AUTH_MODE=entra): the server trusts only this token.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Development (AUTH_MODE=header). In entra mode the server rejects a mismatch.
      'X-Sales-User-Email': email,
      ...(init.headers ?? {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: { message?: string } }
  // The API's global error handler returns { error: { message } }; plain FastAPI returns { detail }.
  if (!response.ok) throw new Error(data.error?.message || data.detail || `Request failed (${response.status})`)
  return data as T
}

export const agentApi = {
  overview: (email: string, name: string) =>
    call<AgentOverview>(email, `/overview?user_name=${encodeURIComponent(name)}`),
  updateProfile: (email: string, name: string, changes: Partial<AgentProfile>) =>
    call<AgentProfile>(email, `/profile?user_name=${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    }),
  campaigns: (email: string) => call<Campaign[]>(email, '/campaigns'),
  createCampaign: (
    email: string,
    body: { name: string; goal: string; audience: Campaign['audience']; steps: CampaignStep[] },
  ) => call<Campaign>(email, '/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  activate: (email: string, id: number) => call<Campaign>(email, `/campaigns/${id}/activate`, { method: 'POST' }),
  setStatus: (email: string, id: number, status: 'paused' | 'completed') =>
    call<Campaign>(email, `/campaigns/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  actions: (email: string, status?: string) =>
    call<AgentAction[]>(email, `/actions${status ? `?status=${status}` : ''}`),
  approve: (email: string, id: number, edits?: { subject?: string; body?: string; slot_index?: number }) =>
    call<AgentAction>(email, `/actions/${id}/approve`, { method: 'POST', body: JSON.stringify(edits ?? {}) }),
  reject: (email: string, id: number, stopSequence = false) =>
    call<AgentAction>(email, `/actions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ stop_sequence: stopSequence }),
    }),
  acknowledge: (email: string, id: number) =>
    call<AgentAction>(email, `/actions/${id}/acknowledge`, { method: 'POST' }),
  approveAll: (email: string) => call<{ approved: number }>(email, '/actions/approve-all', { method: 'POST' }),
  run: (email: string) =>
    call<{ replies: number; planned: number; done: number; failed: number; skipped: number; deferred: number }>(
      email,
      '/run',
      { method: 'POST' },
    ),
  activity: (email: string) => call<AuditItem[]>(email, '/activity?limit=150'),
  suppress: (email: string, target: string) =>
    call<{ ok: boolean }>(email, '/suppressions', { method: 'POST', body: JSON.stringify({ email: target }) }),
  simulateReply: (email: string, prospect: string, text: string) =>
    call<{ handled: number }>(email, '/simulate-reply', {
      method: 'POST',
      body: JSON.stringify({ email: prospect, text }),
    }),
}
