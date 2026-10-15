import { getAuthToken } from '@/infrastructure/api/client'

import { env } from '@/config/env'

import type { AiCapability, AiPageContext, AiMessageForm, AiMessageAction } from '@/features/ai-copilot/types/copilot.types'



const AI_BASE = `${env.VITE_API_BASE_URL}/ai`



export type BackendCapability =

  | 'summarize_lead'

  | 'summarize_opportunity'

  | 'follow_up_email'

  | 'meeting_notes'

  | 'win_probability'

  | 'next_best_action'

  | 'missing_information'

  | 'suggest_stage'

  | 'risk_analysis'

  | 'suggested_tasks'



export interface EntityContextPayload {

  entity_type?: string

  entity_id?: string

  entity_name?: string

  page?: string

  page_label?: string

  metadata?: Record<string, string>

}



export interface ChatMessagePayload {

  role: 'user' | 'assistant' | 'system'

  content: string

}



export interface ChatStreamRequest {

  message: string

  conversation_id?: string | null

  capability?: BackendCapability | null

  context?: EntityContextPayload | null

  user_name?: string

  user_email?: string

  history?: ChatMessagePayload[]

}



export interface AiPlatformStatus {

  provider: string

  model: string

  available: boolean

  prompt_version: string

}



export function mapPageContextToEntity(context: AiPageContext): EntityContextPayload {

  return {

    entity_type: context.entityType,

    entity_id: context.entityId,

    entity_name: context.entityName,

    page: context.page,

    page_label: context.pageLabel,

    metadata: context.metadata,

  }

}



export function mapCapabilityToBackend(capability?: AiCapability, context?: AiPageContext): BackendCapability | null {

  if (!capability || capability === 'ask') return null



  const map: Partial<Record<AiCapability, BackendCapability>> = {

    lead_summary: 'summarize_lead',

    customer_summary: 'summarize_lead',

    generate_summary: context?.entityType === 'opportunity' ? 'summarize_opportunity' : 'summarize_lead',

    draft_email: 'follow_up_email',

    create_followup: 'follow_up_email',

    meeting_summary: 'meeting_notes',

    opportunity_insights: 'summarize_opportunity',

    proposal_summary: 'summarize_opportunity',

    pipeline_insights: 'next_best_action',

    next_best_action: 'next_best_action',

    risk_analysis: 'risk_analysis',

    task_suggestions: 'suggested_tasks',

    win_probability: 'win_probability',

    missing_information: 'missing_information',

    suggest_stage: 'suggest_stage',

  }



  return map[capability] ?? null

}



export async function fetchAiPlatformStatus(): Promise<AiPlatformStatus> {

  const response = await fetch(`${AI_BASE}/status`)

  if (!response.ok) {

    throw new Error('Unable to reach AI platform')

  }

  return response.json() as Promise<AiPlatformStatus>

}



export async function streamChatResponse(

  request: ChatStreamRequest,

  onChunk: (text: string) => void,

  signal?: AbortSignal,
  userEmail?: string,

): Promise<{ conversationId?: string }> {

  const response = await fetch(`${AI_BASE}/chat/stream`, {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(userEmail ? { 'X-Sales-User-Email': userEmail } : {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },

    body: JSON.stringify({

      message: request.message,

      conversation_id: request.conversation_id ?? undefined,

      capability: request.capability ?? undefined,

      context: request.context ?? undefined,

      user_name: request.user_name ?? 'Sales User',

      history: request.history ?? [],

    }),

    signal,

  })



  if (!response.ok) {

    const errorText = await response.text()

    throw new Error(errorText || `AI request failed (${response.status})`)

  }



  if (!response.body) {

    throw new Error('Streaming not supported by the browser')

  }



  const reader = response.body.getReader()

  const decoder = new TextDecoder()

  let buffer = ''

  let conversationId: string | undefined



  while (true) {

    const { done, value } = await reader.read()

    if (done) break



    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')

    buffer = lines.pop() ?? ''



    for (const line of lines) {

      const trimmed = line.trim()

      if (!trimmed.startsWith('data:')) continue



      const payload = trimmed.slice(5).trim()

      if (payload === '[DONE]') continue



      try {

        const parsed = JSON.parse(payload) as { content?: string; conversation_id?: string; error?: string; done?: boolean }

        if (parsed.error) throw new Error(parsed.error)

        if (parsed.content) onChunk(parsed.content)

        if (parsed.conversation_id) conversationId = parsed.conversation_id

      } catch (error) {

        if (error instanceof SyntaxError) continue

        throw error

      }

    }

  }



  return { conversationId }

}



export async function fetchLeadAiSummary(leadId: string): Promise<{

  lead_id: string

  summary: string

  model: string

  generated_at: string

  generated_by: string

}> {

  const response = await fetch(`${AI_BASE}/lead-summary/${leadId}`)

  if (!response.ok) {

    const errorText = await response.text()

    throw new Error(errorText || `AI summary request failed (${response.status})`)

  }

  return response.json()

}





export interface AgentCommandResponse {

  handled: boolean

  reply: string

  actions?: AiMessageAction[]

  table?: { headers: string[]; rows: string[][] }

  form?: AiMessageForm

  /** True when the submitted form failed validation and should stay open. */

  keep_form?: boolean

  cards?: import('@/components/patterns/RecordGallery').RecordCardData[]

}



/** CRM record the user currently has open (Lead 360 / Opportunity 360). */

export interface AgentRecordContext {

  entity_type?: string

  entity_id?: string

  entity_name?: string

}



export async function runAgentCommand(

  message: string,

  conversationId: string,

  userEmail: string,

  userName?: string,

  context?: AgentRecordContext,

): Promise<AgentCommandResponse> {

  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/command`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json', 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

    body: JSON.stringify({ message, conversation_id: conversationId, user_name: userName, context }),

  })

  if (!response.ok) {

    const errorText = await response.text()

    throw new Error(errorText || `Sales agent request failed (${response.status})`)

  }

  return response.json() as Promise<AgentCommandResponse>

}





export async function submitAgentForm(

  formId: string,

  conversationId: string,

  values: Record<string, string>,

  userEmail: string,

  userName?: string,

): Promise<AgentCommandResponse> {

  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/form`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json', 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

    body: JSON.stringify({ form_id: formId, conversation_id: conversationId, values, user_name: userName }),

  })

  if (!response.ok) {

    const errorText = await response.text()

    throw new Error(errorText || `Sales assistant form failed (${response.status})`)

  }

  return response.json() as Promise<AgentCommandResponse>

}



export interface AgentConfirmResult {

  success: boolean

  message: string

  actions?: AiMessageAction[]

  table?: { headers: string[]; rows: string[][] }

  form?: AiMessageForm

}



export async function confirmAgentAction(token: string, userEmail: string): Promise<AgentConfirmResult> {

  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/confirm/${token}`, {

    method: 'POST',

    headers: { 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

  })

  const data = await response.json().catch(() => ({})) as Partial<AgentConfirmResult> & { detail?: string; error?: { message?: string } }

  if (!response.ok) throw new Error(data.error?.message || data.detail || data.message || `Confirmation failed (${response.status})`)

  return {

    success: Boolean(data.success),

    message: data.message || 'Action completed.',

    actions: data.actions?.length ? data.actions : undefined,

    table: data.table ?? undefined,

    form: data.form ?? undefined,

  }

}



export async function cancelAgentAction(token: string, userEmail: string): Promise<{ success: boolean; message: string }> {

  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/cancel/${token}`, {

    method: 'POST',

    headers: { 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

  })

  const data = await response.json().catch(() => ({})) as { success?: boolean; message?: string; detail?: string; error?: { message?: string } }

  if (!response.ok) throw new Error(data.error?.message || data.detail || data.message || `Cancellation failed (${response.status})`)

  return { success: Boolean(data.success), message: data.message || 'Action cancelled.' }

}



export const SalesAssistantApi = {

  fetchAiPlatformStatus,

  fetchLeadAiSummary,

  streamChatResponse,

  mapPageContextToEntity,

  mapCapabilityToBackend,

  runAgentCommand,

  submitAgentForm,

  confirmAgentAction,

  cancelAgentAction,

  uploadAgentFile,

}



export async function uploadAgentFile(

  file: File,

  userEmail: string,

): Promise<{ filename: string; text: string }> {

  const formData = new FormData()

  formData.append('file', file)



  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/upload`, {

    method: 'POST',

    headers: { 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

    body: formData,

  })



  const data = await response.json().catch(() => ({})) as {

    filename?: string

    text?: string

    detail?: string

  }



  if (!response.ok) {

    throw new Error(data.detail || `File upload failed (${response.status})`)

  }



  return {

    filename: data.filename || file.name,

    text: data.text || '',

  }

}



/* ── Daily sales brief (welcome page) ─────────────────────────────────── */



export interface SalesBriefTask {

  id: string

  subject: string

  due_date: string | null

  due_label: string

  priority: 'high' | 'medium' | 'low' | null

  priority_label: string

  owner: string

  regarding: string | null

  regarding_id: string | null

  overdue: boolean

  due_today: boolean

}



export interface SalesBriefOpportunity {

  id: string

  name: string

  customer: string

  stage: string

  close_date: string | null

  value: number | null

  status: 'At risk' | 'Needs attention' | 'On track'

  flags: { kind: string; text: string; evidence: string }[]

  recommendations: { action: string; reason: string; command?: string | null; label?: string | null }[]

}



export interface SalesBrief {

  user: string

  date: string

  counts: {

    tasks_due_today: number

    overdue_tasks: number

    high_priority_tasks: number

    open_tasks: number

    upcoming_meetings: number

    opportunities_needing_attention: number

    upcoming_closes: number

  }

  tasks: SalesBriefTask[]

  meetings: { id: string; subject: string; date: string; time: string; regarding: string | null }[]

  opportunities: SalesBriefOpportunity[]

  pipeline: import('@/components/patterns/RecordGallery').RecordCardData[]

  recommendations: { opportunity: string; action: string; reason: string; command?: string | null }[]

}



export async function fetchSalesBrief(userEmail: string, userName?: string): Promise<SalesBrief> {

  const params = userName ? `?user_name=${encodeURIComponent(userName)}` : ''

  const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/brief${params}`, {

    headers: { 'X-Sales-User-Email': userEmail, ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) },

  })

  if (!response.ok) {

    const errorText = await response.text()

    throw new Error(errorText || `Sales brief request failed (${response.status})`)

  }

  return response.json() as Promise<SalesBrief>

}
