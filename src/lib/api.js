import { getBackendAccessToken } from "../auth";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export function getApiBase() {
  return API_BASE;
}

const GET_CACHE = new Map()
const GET_IN_FLIGHT = new Map()
const GET_CACHE_TTL = 15000
const GET_CACHE_LIMIT = 100

function rememberGet(key, value) {
  // Keep the cache bounded and refresh insertion order for simple LRU behaviour.
  GET_CACHE.delete(key)
  GET_CACHE.set(key, { at: Date.now(), value })
  while (GET_CACHE.size > GET_CACHE_LIMIT) GET_CACHE.delete(GET_CACHE.keys().next().value)
}

export function clearApiGetCache() {
  GET_CACHE.clear()
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const cacheKey = `${method}:${path}`
  const canReuse = method === 'GET' && !options.noCache && !options.signal

  if (canReuse) {
    const hit = GET_CACHE.get(cacheKey)
    if (hit && Date.now() - hit.at < GET_CACHE_TTL) return hit.value
    if (hit) GET_CACHE.delete(cacheKey)
    const pending = GET_IN_FLIGHT.get(cacheKey)
    if (pending) return pending
  }

  const request = (async () => {
    const token = await getBackendAccessToken()
    const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
    const isFormData = options.body instanceof FormData
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    }

    let response
    try {
      const { noCache, ...fetchOptions } = options
      response = await fetch(url, { ...fetchOptions, headers })
    } catch (error) {
      console.error('CRM API connection error:', error)
      throw new Error(`CRM API request failed: ${error.message}`, { cause: error })
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error('CRM authentication failed. Check the Microsoft API scope and backend token validation.')
      }
      throw new Error(body.detail || body.message || `${response.status} ${response.statusText}`)
    }

    if (response.status === 204) {
      if (method !== 'GET') clearApiGetCache()
      return null
    }
    const data = await response.json()
    if (canReuse) rememberGet(cacheKey, data)
    if (method !== 'GET') clearApiGetCache()
    return data
  })()

  if (canReuse) GET_IN_FLIGHT.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (canReuse && GET_IN_FLIGHT.get(cacheKey) === request) GET_IN_FLIGHT.delete(cacheKey)
  }
}


export async function streamAssistantChat(payload, onChunk, signal) {
  const token = await getBackendAccessToken()
  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Assistant stream failed (${response.status})`)
  }
  if (!response.body) throw new Error('Streaming is not supported by this browser response.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let conversationId = payload.conversation_id || null
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\\n\\n')
    buffer = frames.pop() || ''
    for (const frame of frames) {
      const line = frame.split('\\n').find((part) => part.startsWith('data: '))
      if (!line) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') continue
      try {
        const event = JSON.parse(raw)
        if (event.content) onChunk(event.content)
        if (event.conversation_id) conversationId = event.conversation_id
        if (event.error) throw new Error(event.error)
      } catch (error) {
        if (error instanceof SyntaxError) continue
        throw error
      }
    }
  }
  return { conversation_id: conversationId }
}

export async function downloadFile(path, filename) {
  const token = await getBackendAccessToken();
  const response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || `Download failed (${response.status})`); }
  const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}


// Conversational CRM agent endpoints. These use the existing SalesAgentService
// workflow API (interactive forms + explicit confirmation), not transcript analysis.
async function agentRequest(path, { method = 'GET', body, userEmail, isFormData = false } = {}) {
  const token = await getBackendAccessToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(userEmail ? { 'X-Sales-User-Email': userEmail } : {}),
    ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
  })
  const raw = await response.text()
  let data = {}
  if (raw) { try { data = JSON.parse(raw) } catch { data = { detail: raw } } }
  if (!response.ok) throw new Error(data.detail || data.message || data.error?.message || `AI agent request failed (${response.status})`)
  return data
}

export const salesAgentApi = {
  command: (payload, userEmail) => agentRequest('/ai/agent/command', { method: 'POST', body: payload, userEmail }),
  submitForm: (payload, userEmail) => agentRequest('/ai/agent/form', { method: 'POST', body: payload, userEmail }),
  confirm: (token, userEmail) => agentRequest(`/ai/agent/confirm/${encodeURIComponent(token)}`, { method: 'POST', userEmail }),
  cancel: (token, userEmail) => agentRequest(`/ai/agent/cancel/${encodeURIComponent(token)}`, { method: 'POST', userEmail }),
  upload: (file, userEmail) => { const form = new FormData(); form.append('file', file); return agentRequest('/ai/agent/upload', { method: 'POST', body: form, isFormData: true, userEmail }) },
  conversations: (userEmail) => agentRequest('/ai/conversations', { userEmail }),
  conversation: (id, userEmail) => agentRequest(`/ai/conversations/${encodeURIComponent(id)}`, { userEmail }),
  deleteConversation: (id, userEmail) => agentRequest(`/ai/conversations/${encodeURIComponent(id)}`, { method: 'DELETE', userEmail }),
  capability: (name, payload, userEmail) => agentRequest(`/ai/capabilities/${encodeURIComponent(name)}`, { method: 'POST', body: payload, userEmail }),
  downloadDocument: async (id, userEmail) => {
    const token = await getBackendAccessToken()
    const response = await fetch(`${API_BASE}/ai/agent/documents/${encodeURIComponent(id)}/download`, { headers: { Authorization: `Bearer ${token}`, 'X-Sales-User-Email': userEmail } })
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || `Document download failed (${response.status})`) }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `crm-document-${id}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url)
  },
}

export const crmApi = {
  // Leads
  leads: () => apiRequest("/dataverse/leads"),

  createLead: (payload) =>
    apiRequest("/dataverse/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateLead: (id, payload) =>
    apiRequest(`/dataverse/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  qualifyLead: (id, payload = {}) =>
    apiRequest(`/dataverse/leads/${id}/qualify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  disqualifyLead: (id, payload = {}) =>
    apiRequest(`/dataverse/leads/${id}/disqualify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Opportunities
  opportunities: () =>
    apiRequest("/dataverse/opportunities"),

  createOpportunity: (payload) =>
    apiRequest("/dataverse/opportunities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateOpportunity: (id, payload) =>
    apiRequest(`/dataverse/opportunities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  winOpportunity: (id, payload = {}) =>
    apiRequest(`/dataverse/opportunities/${id}/win`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  loseOpportunity: (id, payload = {}) =>
    apiRequest(`/dataverse/opportunities/${id}/lose`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Dataverse CRM workspace (live records only)
  accounts: () => apiRequest("/dataverse/crm/accounts"),
  account: (id) => apiRequest(`/crm/accounts/${id}`),
  contacts: () => apiRequest("/dataverse/crm/contacts"),
  contact: (id) => apiRequest(`/crm/contacts/${id}`),
  activities: () => apiRequest("/dataverse/crm/activities"),
  tasks: () => apiRequest("/dataverse/crm/tasks"),
  lead: (id) => apiRequest(`/dataverse/leads/${id}`),
  opportunity: (id) => apiRequest(`/dataverse/opportunities/${id}`),
  leadNotes: (id) => apiRequest(`/dataverse/leads/${id}/notes`),
  createLeadNote: (id, payload) => apiRequest(`/dataverse/leads/${id}/notes`, { method: 'POST', body: JSON.stringify(payload), noCache: true }),
  opportunityNotes: (id) => apiRequest(`/dataverse/opportunities/${id}/notes`),
  createOpportunityNote: (id, payload) => apiRequest(`/dataverse/opportunities/${id}/notes`, { method: 'POST', body: JSON.stringify(payload), noCache: true }),
  leadTemplate: () => downloadFile('/templates/leads.xlsx', 'Lead_Template.xlsx'),
  opportunityTemplate: () => downloadFile('/templates/opportunities.xlsx', 'Opportunity_Template.xlsx'),
  previewImport: (file) => { const f = new FormData(); f.append('file', file); return apiRequest('/imports/preview', { method: 'POST', body: f }); },
  createImport: (payload) => apiRequest('/imports/create', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard
  dashboardKpis: () =>
    apiRequest("/dashboard/kpis"),

  // AI Assistant
  assistantStatus: () =>
    apiRequest("/ai/status"),

  assistantChat: (payload) => apiRequest("/ai/chat", { method: "POST", body: JSON.stringify(payload) }),
  assistantConversations: () => apiRequest('/ai/conversations'),
  assistantConversation: (id) => apiRequest(`/ai/conversations/${id}`),
  deleteAssistantConversation: (id) => apiRequest(`/ai/conversations/${id}`, { method: 'DELETE' }),
  assistantCapability: (name, payload) => apiRequest(`/ai/capabilities/${name}`, { method: 'POST', body: JSON.stringify(payload) }),

  analyzeTranscript: async (file) => { const f = new FormData(); f.append('file', file); return apiRequest('/conversation-intelligence/analyze-transcript', { method: 'POST', body: f, noCache: true }); },
  teamsTranscript: (payload) => apiRequest('/conversation-intelligence/teams/transcript', { method: 'POST', body: JSON.stringify(payload), noCache: true }),
};