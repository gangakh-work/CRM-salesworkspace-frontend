import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { toast as sonnerToast } from 'sonner'

import { STORAGE_KEYS } from '@/config/constants'
import { notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { apiClient } from '@/infrastructure/api/client'
import { env } from '@/config/env'
import { useUser } from '@/features/auth/hooks/useUser'
import { DEFAULT_SUGGESTED_PROMPTS, PINNED_PROMPTS } from '@/features/ai-copilot/data/suggested-prompts'
import {
  mapCapabilityToBackend,
  mapPageContextToEntity,
  streamChatResponse,
  uploadAgentFile,
  runAgentCommand,
  submitAgentForm,
  confirmAgentAction,
  cancelAgentAction,
  type AgentConfirmResult,
} from '@/features/ai-copilot/api/SalesAssistantApi'
import { resolvePageContextFromPath } from '@/features/ai-copilot/lib/resolve-page-context'
import type {
  AiCapability,
  AiConversation,
  AiCopilotMode,
  AiMessage,
  AiPageContext,
  AiSuggestedPrompt,
} from '@/features/ai-copilot/types/copilot.types'

let convCounter = 0
function convId() {
  convCounter += 1
  return `conv-${Date.now()}-${convCounter}`
}

function msgId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface AiCopilotContextValue {
  isOpen: boolean
  mode: AiCopilotMode
  panelWidth: number
  isGenerating: boolean
  activeConversationId: string | null
  messages: AiMessage[]
  conversations: AiConversation[]
  pageContext: AiPageContext
  registeredContext: AiPageContext | null
  suggestedPrompts: AiSuggestedPrompt[]
  pinnedPrompts: AiSuggestedPrompt[]
  open: (opts?: { prompt?: string; mode?: AiCopilotMode }) => void
  close: () => void
  toggle: () => void
  setMode: (mode: AiCopilotMode) => void
  setPanelWidth: (width: number) => void
  sendMessage: (
  content: string,
  capability?: AiCapability,
  attachments?: File[],
) => Promise<void>
  stopGeneration: () => void
  retryLast: () => void
  clearConversation: () => void
  setRegisteredContext: (ctx: AiPageContext | null) => void
  loadConversation: (id: string) => void
  newConversation: () => void
  toggleFavorite: (id: string) => void
  togglePinnedPrompt: (promptId: string) => void
  deleteConversation: (id: string) => void
  handleMessageAction: (actionId: string, messageId?: string) => Promise<void>
  handleFormSubmit: (messageId: string, formId: string, values: Record<string, string>) => Promise<void>
  handleFormCancel: (messageId: string) => Promise<void>
}

const AiCopilotContext = createContext<AiCopilotContextValue | null>(null)

const ACTIVE_CONVERSATION_KEY = 'sw:ai-active-conversation'

const DEFAULT_WIDTH = 380
const MIN_WIDTH = 320
const MAX_WIDTH = 560

function loadWidth(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.aiCopilotWidth)
    if (v) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(v)))
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH
}

function loadMode(): AiCopilotMode {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.aiCopilotMode)
    if (v === 'docked' || v === 'floating' || v === 'fullscreen' || v === 'collapsed') return v
  } catch {
    /* ignore */
  }
  return 'docked'
}

function loadConversations(): AiConversation[] {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.aiCopilotHistory)
    if (v) return JSON.parse(v) as AiConversation[]
  } catch {
    /* ignore */
  }
  return []
}

function createConversation(context?: AiPageContext, id: string = convId()): AiConversation {
  const now = new Date().toISOString()
  return {
    id,
    title: 'New conversation',
    messages: [],
    context,
    createdAt: now,
    updatedAt: now,
  }
}

export function AiCopilotProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { displayName, email } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setModeState] = useState<AiCopilotMode>(loadMode)
  const [panelWidth, setPanelWidthState] = useState(loadWidth)
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversations, setConversations] = useState<AiConversation[]>(loadConversations)
  // Resume the last conversation after a reload / reopening the assistant.
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_CONVERSATION_KEY)
    } catch {
      return null
    }
  })
  const [registeredContext, setRegisteredContext] = useState<AiPageContext | null>(null)
  const [favoritePromptIds, setFavoritePromptIds] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)
  const lastUserPromptRef = useRef('')
  const sendMessageRef = useRef<(content: string) => Promise<void>>(async () => {})

  /** Refresh CRM lists/dashboards after the assistant wrote to Dataverse. */
  const notifyCrmChanged = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.ai.all })
    notifyOpportunityUpdated()
    window.dispatchEvent(new CustomEvent('crm:assistant-data-changed'))
  }, [queryClient])

  const pathContext = useMemo(
    () => resolvePageContextFromPath(location.pathname),
    [location.pathname],
  )

  const pageContext = useMemo(
    () => (registeredContext ? { ...pathContext, ...registeredContext } : pathContext),
    [pathContext, registeredContext],
  )

  /** CRM record currently open (Lead 360 / Opportunity 360) — sent to the agent. */
  const recordContext = useMemo(
    () =>
      pageContext.entityType === 'lead' || pageContext.entityType === 'opportunity'
        ? {
            entity_type: pageContext.entityType,
            entity_id: pageContext.entityId,
            entity_name: pageContext.entityName,
          }
        : undefined,
    [pageContext.entityType, pageContext.entityId, pageContext.entityName],
  )

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  )

  const messages = activeConversation?.messages ?? []

  const persistConversations = useCallback((next: AiConversation[]) => {
    setConversations(next)
    try {
      localStorage.setItem(STORAGE_KEYS.aiCopilotHistory, JSON.stringify(next.slice(0, 50)))
    } catch {
      /* ignore */
    }
  }, [])

  const updateMessages = useCallback(
    (updater: (msgs: AiMessage[]) => AiMessage[], conversationIdOverride?: string) => {
      setConversations((prev) => {
        let cid = conversationIdOverride ?? activeConversationId
        if (!cid || !prev.some((c) => c.id === cid)) {
          cid = cid ?? convId()
          const conv = createConversation(pageContext, cid)
          cid = conv.id
          setActiveConversationId(cid)
          const withNew = [conv, ...prev]
          const updated = withNew.map((c) => {
            if (c.id !== cid) return c
            const nextMsgs = updater(c.messages)
            return {
              ...c,
              messages: nextMsgs,
              updatedAt: new Date().toISOString(),
              title:
                c.title === 'New conversation' && nextMsgs[0]?.role === 'user'
                  ? nextMsgs[0].content.slice(0, 48)
                  : c.title,
              context: pageContext,
            }
          })
          try {
            localStorage.setItem(STORAGE_KEYS.aiCopilotHistory, JSON.stringify(updated.slice(0, 50)))
          } catch {
            /* ignore */
          }
          return updated
        }

        const updated = prev.map((c) => {
          if (c.id !== cid) return c
          const nextMsgs = updater(c.messages)
          return {
            ...c,
            messages: nextMsgs,
            updatedAt: new Date().toISOString(),
            title:
              c.title === 'New conversation' && nextMsgs[0]?.role === 'user'
                ? nextMsgs[0].content.slice(0, 48)
                : c.title,
            context: pageContext,
          }
        })
        try {
          localStorage.setItem(STORAGE_KEYS.aiCopilotHistory, JSON.stringify(updated.slice(0, 50)))
        } catch {
          /* ignore */
        }
        return updated
      })
    },
    [activeConversationId, pageContext],
  )

  const setMode = useCallback((m: AiCopilotMode) => {
    setModeState(m)
    try {
      localStorage.setItem(STORAGE_KEYS.aiCopilotMode, m)
    } catch {
      /* ignore */
    }
    if (m === 'collapsed') setIsOpen(false)
    else setIsOpen(true)
  }, [])

  const setPanelWidth = useCallback((w: number) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w))
    setPanelWidthState(clamped)
    try {
      localStorage.setItem(STORAGE_KEYS.aiCopilotWidth, String(clamped))
    } catch {
      /* ignore */
    }
  }, [])

  const open = useCallback(
    (opts?: { prompt?: string; mode?: AiCopilotMode }) => {
      if (opts?.mode) setMode(opts.mode)
      else setModeState('fullscreen')
      setIsOpen(true)
      if (opts?.prompt) {
        window.setTimeout(() => {
          void sendMessageRef.current(opts.prompt!)
        }, 150)
      }
    },
    // Must stay stable: pages auto-open the assistant in an effect that
    // depends on `open`. Depending on `mode` here re-ran those effects on
    // every layout change and snapped full screen straight back to docked.
    [setMode],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    if (mode !== 'floating') setModeState('collapsed')
  }, [mode])

  const toggle = useCallback(() => {
    if (isOpen) close()
    else open()
  }, [isOpen, close, open])

  const sendMessageInternal = useCallback(
    async (
      content: string,
      capability?: AiCapability,
      attachments: File[] = [],
    ) => {
      const trimmed = content.trim()
      if ((!trimmed && attachments.length === 0) || isGenerating) return

      const excelFiles = attachments.filter((file) => /\.(xlsx|xlsm)$/i.test(file.name))
      const transcriptFiles = attachments.filter((file) => /\.(pdf|docx|txt|md)$/i.test(file.name))
      if (excelFiles.length === 0 && transcriptFiles.length > 0) {
        const conversationId = activeConversationId ?? `conv-${Date.now()}`
        updateMessages((msgs) => [...msgs, { id: msgId(), role: 'user', content: trimmed || `Analyze ${transcriptFiles.map(f=>f.name).join(', ')}`, timestamp: new Date().toISOString() }], conversationId)
        setIsGenerating(true)
        try {
          const reports: string[] = []
          for (const file of transcriptFiles) {
            const form = new FormData(); form.append('file', file)
            const response = await apiClient.post('/conversation-intelligence/analyze-transcript', form)
            const payload = response.data as {analysis?: {summary?:string; lead?:Record<string,unknown>; opportunity?:Record<string,unknown>; missing_fields?:unknown[]; next_steps?:unknown[]; customer_needs?:unknown[]}; review_required?:boolean}
            const analysis = payload.analysis ?? {}
            reports.push(`**${file.name} — Conversation Intelligence**\n\n${analysis.summary ?? 'Transcript analyzed.'}\n\n**Customer needs:** ${(analysis.customer_needs ?? []).map(String).join('; ') || 'None explicitly extracted'}\n**Next steps:** ${(analysis.next_steps ?? []).map(String).join('; ') || 'None explicitly extracted'}\n**Missing fields:** ${(analysis.missing_fields ?? []).map(String).join(', ') || 'None reported'}`)
            const lead = analysis.lead ?? {}
            const leadRequired = ['subject','firstname','lastname','companyname','emailaddress1','telephone1']
            const leadComplete = leadRequired.every(key => typeof lead[key] === 'string' && String(lead[key]).trim())
            if (leadComplete && window.confirm(`${file.name}\nCreate a Lead from the extracted transcript details?\n\nName: ${lead.firstname} ${lead.lastname}\nCompany: ${lead.companyname}\nEmail: ${lead.emailaddress1}\n\nOnly explicitly extracted information will be saved.`)) {
              const result = await apiClient.post('/imports/create', {entity:'leads', records:[lead], confirm:true})
              reports.push(`Lead creation result: ${result.data.created_count} created, ${result.data.failed_count} failed.`)
            } else if (!leadComplete) reports.push(`Lead not created: required fields are missing (${leadRequired.filter(key => !(typeof lead[key] === 'string' && String(lead[key]).trim())).join(', ')}).`)
            const opportunity = analysis.opportunity ?? {}
            if (typeof opportunity.name === 'string' && opportunity.name.trim() && window.confirm(`${file.name}\nCreate an Opportunity from the extracted transcript details?\n\nName: ${opportunity.name}\nEstimated value: ${opportunity.estimatedvalue ?? 'Not specified'}\n\nReview the extracted fields before confirming.`)) {
              const result = await apiClient.post('/imports/create', {entity:'opportunities', records:[opportunity], confirm:true})
              reports.push(`Opportunity creation result: ${result.data.created_count} created, ${result.data.failed_count} failed.`)
            }
          }
          updateMessages((msgs) => [...msgs, { id: msgId(), role: 'assistant', content: reports.join('\n\n'), contentType: 'markdown', timestamp: new Date().toISOString() }], conversationId)
          if (reports.some(report => /creation result: [1-9]/.test(report))) notifyCrmChanged()
        } catch (error) {
          sonnerToast.error('Transcript processing failed', { description: error instanceof Error ? error.message : 'Unable to analyze transcript.' })
        } finally { setIsGenerating(false) }
        return
      }

      // Excel uploads use the reviewed bulk-import API instead of flattening workbook
      // cells into a generic prompt. Every row is validated and previewed before writes.
      if (excelFiles.length > 0) {
        const conversationId = activeConversationId ?? `conv-${Date.now()}`
        const userMsg: AiMessage = { id: msgId(), role: 'user', content: trimmed || `Import ${excelFiles.map(f => f.name).join(', ')}`, timestamp: new Date().toISOString() }
        updateMessages((msgs) => [...msgs, userMsg], conversationId)
        setIsGenerating(true)
        try {
          const reports: string[] = []
          for (const file of excelFiles) {
            const form = new FormData()
            form.append('file', file)
            const previewResponse = await apiClient.post('/imports/preview', form)
            const preview = previewResponse.data as { entity: 'leads' | 'opportunities'; total: number; valid_count: number; invalid_count: number; rows: Array<{row:number; valid:boolean; data:Record<string, unknown>; errors:Array<{field:string;message:string}>}> }
            const validRows = preview.rows.filter(row => row.valid).map(row => row.data)
            const invalidSummary = preview.rows.filter(row => !row.valid).map(row => `Row ${row.row}: ${row.errors.map(e => `${e.field}: ${e.message}`).join('; ')}`).join('\n')
            if (validRows.length === 0) {
              reports.push(`${file.name}: no valid records. ${invalidSummary}`)
              continue
            }
            const approved = window.confirm(`${file.name}\nEntity: ${preview.entity}\nTotal rows: ${preview.total}\nValid: ${preview.valid_count}\nInvalid: ${preview.invalid_count}\n\nCreate the ${validRows.length} valid record(s) in Dataverse now?${invalidSummary ? `\n\nInvalid rows will be skipped:\n${invalidSummary}` : ''}`)
            if (!approved) { reports.push(`${file.name}: import cancelled. No records created.`); continue }
            const createResponse = await apiClient.post('/imports/create', { entity: preview.entity, records: validRows, confirm: true })
            const created = createResponse.data as {created_count:number; failed_count:number; results:Array<{row:number;created:boolean;error?:string}>}
            reports.push(`${file.name}: ${created.created_count} created, ${created.failed_count} failed.${created.failed_count ? `\n${created.results.filter(r=>!r.created).map(r=>`Row ${r.row}: ${r.error ?? 'Creation failed'}`).join('\n')}` : ''}${invalidSummary ? `\nSkipped invalid rows:\n${invalidSummary}` : ''}`)
          }
          updateMessages((msgs) => [...msgs, { id: msgId(), role: 'assistant', content: reports.join('\n\n'), contentType: 'markdown', timestamp: new Date().toISOString() }], conversationId)
          if (reports.some(report => /\d+ created/.test(report))) notifyCrmChanged()
        } catch (error) {
          sonnerToast.error('Excel import failed', { description: error instanceof Error ? error.message : 'Unable to validate or create records.' })
          updateMessages((msgs) => [...msgs, { id: msgId(), role: 'assistant', content: `Excel import failed: ${error instanceof Error ? error.message : 'Unable to validate the workbook.'}`, timestamp: new Date().toISOString() }], conversationId)
        } finally {
          setIsGenerating(false)
        }
        return
      }

      let effectiveContent = trimmed
      if (attachments.length > 0) {
        try {
          const extracted = await Promise.all(attachments.map((file) => uploadAgentFile(file, email)))
          const fileContext = extracted.map(({ filename, text }) => `\n\n--- Uploaded file: ${filename} ---\n${text}`).join('\n')
          const instruction = trimmed || 'Analyze the uploaded file(s) and identify the appropriate CRM action. For spreadsheets, inspect every row and prepare a row-by-row lead preview; do not create records until I confirm. For transcripts, extract facts and map them to supported CRM fields. Do not invent missing information.'
          effectiveContent = `${instruction}${fileContext}`
        } catch (error) {
          sonnerToast.error('Unable to process uploaded file', { description: error instanceof Error ? error.message : 'Please try again.' })
          return
        }
      }
      if (!effectiveContent || isGenerating) return

      lastUserPromptRef.current = effectiveContent
      const conversationId = activeConversationId ?? `conv-${Date.now()}`

      const userMsg: AiMessage = {
        id: msgId(),
        role: 'user',
        content: effectiveContent,
        timestamp: new Date().toISOString(),
        capability,
      }

      updateMessages((msgs) => [...msgs, userMsg], conversationId)
      setIsGenerating(true)

      try {
        const agent = await runAgentCommand(effectiveContent, conversationId, email, displayName, recordContext)
        if (agent.handled) {
          const assistantMsg: AiMessage = {
            id: msgId(),
            role: 'assistant',
            content: agent.reply,
            contentType: 'markdown',
            timestamp: new Date().toISOString(),
            actions: agent.actions,
            table: agent.table,
            form: agent.form,
            cards: agent.cards?.length ? agent.cards : undefined,
          }
          updateMessages((msgs) => [...msgs, assistantMsg], conversationId)
          return
        }

        const assistantId = msgId()
        const streamingMsg: AiMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          contentType: 'markdown',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          capability,
        }
        updateMessages((msgs) => [...msgs, streamingMsg], conversationId)

        const controller = new AbortController()
        abortRef.current = controller
        const history = (activeConversation?.messages ?? []).map((m) => ({ role: m.role, content: m.content }))
        let accumulated = ''
        const onChunk = (chunk: string) => {
          accumulated += chunk
          updateMessages((msgs) => msgs.map((m) => m.id === assistantId ? { ...m, content: accumulated, isStreaming: true } : m), conversationId)
        }
        const { conversationId: backendConversationId } = await streamChatResponse(
          {
            message: effectiveContent,
            conversation_id: conversationId,
            capability: mapCapabilityToBackend(capability, pageContext),
            context: mapPageContextToEntity(pageContext),
            user_name: displayName,
            history,
          },
          onChunk,
          controller.signal,
          email,
        )
        if (backendConversationId && backendConversationId !== conversationId) setActiveConversationId(backendConversationId)
        updateMessages((msgs) => msgs.map((m) => m.id === assistantId ? { ...m, content: accumulated, isStreaming: false } : m), conversationId)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          sonnerToast.error('Failed to generate response', { description: error instanceof Error ? error.message : 'Unknown error' })
        }
      } finally {
        setIsGenerating(false)
        abortRef.current = null
      }
    },
    [isGenerating, updateMessages, pageContext, displayName, email, activeConversationId, activeConversation?.messages, recordContext],
  )

  const handleMessageAction = useCallback(
    async (actionId: string, messageId?: string) => {
      const sep = actionId.indexOf(':')
      const kind = sep >= 0 ? actionId.slice(0, sep) : actionId
      const token = sep >= 0 ? actionId.slice(sep + 1) : ''
      // Suggested follow-up from the agent (e.g. "Create task", "Draft email"):
      // send it as the user's next message so the normal flow handles it.
      if (kind === 'prompt' && token) {
        void sendMessageRef.current(token)
        return
      }
      if (kind === 'convert' && token) {
        // Open the same Convert to Opportunity wizard used in the CRM, but
        // inside the chat. The agent builds it from the qualified lead.
        const conversationId = activeConversationId ?? `conv-${Date.now()}`
        updateMessages((msgs) => [...msgs, {
          id: msgId(),
          role: 'user',
          content: 'Yes — convert to opportunity',
          timestamp: new Date().toISOString(),
        }], conversationId)
        setIsGenerating(true)
        try {
          const agent = await runAgentCommand(`convert lead ${token}`, conversationId, email, displayName, recordContext)
          updateMessages((msgs) => [...msgs, {
            id: msgId(),
            role: 'assistant',
            content: agent.reply,
            contentType: 'markdown',
            timestamp: new Date().toISOString(),
            actions: agent.actions?.length ? agent.actions : undefined,
            table: agent.table ?? undefined,
            form: agent.form ?? undefined,
            cards: agent.cards?.length ? agent.cards : undefined,
          }], conversationId)
        } catch (error) {
          sonnerToast.error('Unable to open conversion form', {
            description: error instanceof Error ? error.message : 'Unknown error',
          })
        } finally {
          setIsGenerating(false)
        }
        return
      }

      if (kind === 'skip-convert' && token) {
        sessionStorage.removeItem('crm:pending-convert-lead')
        updateMessages((msgs) => [...msgs, {
          id: msgId(),
          role: 'assistant',
          content: 'Okay. The lead remains qualified. You can convert it later using the **Convert** action.',
          timestamp: new Date().toISOString(),
          contentType: 'markdown',
        }])
        return
      }

      if (kind === 'download' && token) {
        const popup = window.open('', '_blank')
        try {
          const response = await fetch(`${env.VITE_API_BASE_URL}/ai/agent/documents/${token}/download`, {
            headers: { 'X-Sales-User-Email': email },
          })
          if (!response.ok) throw new Error(await response.text())
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          if (popup) popup.location.href = url
          else {
            const link = document.createElement('a')
            link.href = url
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.click()
          }
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } catch (error) {
          popup?.close()
          sonnerToast.error('Unable to open document', { description: error instanceof Error ? error.message : 'Unknown error' })
        }
        return
      }
      if (!token || (kind !== 'confirm' && kind !== 'cancel')) return
      setIsGenerating(true)
      try {
        const result: AgentConfirmResult = kind === 'confirm'
          ? await confirmAgentAction(token, email)
          : await cancelAgentAction(token, email)
        // The review card is finished once the CRM has answered — remove its
        // Confirm/Cancel buttons so it can't be clicked again. A failed
        // confirmation keeps them so the user can retry.
        if (messageId && (result.success || kind === 'cancel')) {
          updateMessages((msgs) => msgs.map((m) => (
            m.id === messageId
              ? { ...m, actions: m.actions?.filter((a) => !/^(confirm|cancel):/.test(a.id)) }
              : m
          )))
        }
        updateMessages((msgs) => [...msgs, {
          id: msgId(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
          contentType: 'markdown',
          actions: result.actions,
          table: result.table,
          form: result.form,
        }])
        if (kind === 'confirm' && result.success) notifyCrmChanged()
      } catch (error) {
        sonnerToast.error('CRM action failed', { description: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setIsGenerating(false)
      }
    },
    [email, displayName, activeConversationId, recordContext, updateMessages, notifyCrmChanged],
  )

  const handleFormSubmit = useCallback(
    async (messageId: string, formId: string, values: Record<string, string>) => {
      setIsGenerating(true)
      try {
        const conversationId = activeConversationId ?? `conv-${Date.now()}`
        const result = await submitAgentForm(formId, conversationId, values, email, displayName)
        // Keep the form open when the CRM rejected the values so the user can
        // correct them, exactly like the manual wizard stays open on error.
        if (!result.keep_form) {
          updateMessages((msgs) => msgs.map((m) => (m.id === messageId ? { ...m, form: undefined } : m)))
        }
        updateMessages((msgs) => [...msgs, {
          id: msgId(),
          role: 'assistant',
          content: result.reply,
          timestamp: new Date().toISOString(),
          contentType: 'markdown',
          actions: result.actions?.length ? result.actions : undefined,
          table: result.table ?? undefined,
          form: result.form ?? undefined,
          cards: result.cards?.length ? result.cards : undefined,
        }])
        if (!result.keep_form && !result.actions?.some((a) => a.id.startsWith('confirm:'))) notifyCrmChanged()
      } catch (error) {
        sonnerToast.error('Form submission failed', { description: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setIsGenerating(false)
      }
    },
    [activeConversationId, displayName, email, updateMessages, notifyCrmChanged],
  )

  const handleFormCancel = useCallback(
    async (messageId: string) => {
      updateMessages((msgs) => msgs.map((m) => (m.id === messageId ? { ...m, form: undefined } : m)))
      updateMessages((msgs) => [...msgs, {
        id: msgId(),
        role: 'assistant',
        content: 'Cancelled. No CRM changes were made.',
        timestamp: new Date().toISOString(),
        contentType: 'markdown',
      }])
      try {
        // Clear the server-side form session as well.
        await runAgentCommand('cancel', activeConversationId ?? `conv-${Date.now()}`, email, displayName)
      } catch {
        /* the form is already closed locally */
      }
    },
    [activeConversationId, displayName, email, updateMessages],
  )

  useEffect(() => {
    sendMessageRef.current = sendMessageInternal
  }, [sendMessageInternal])

  useEffect(() => {
    try {
      if (activeConversationId) localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId)
      else localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
    } catch {
      /* ignore */
    }
  }, [activeConversationId])

  const sendMessage = sendMessageInternal

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
  }, [])

  const retryLast = useCallback(() => {
    if (!lastUserPromptRef.current) return
    updateMessages((msgs) => {
      const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === 'user')
      if (lastUserIdx < 0) return msgs
      const cutIdx = msgs.length - lastUserIdx - 1
      return msgs.slice(0, cutIdx)
    })
    void sendMessageInternal(lastUserPromptRef.current)
  }, [updateMessages, sendMessageInternal])

  const clearConversation = useCallback(() => {
    if (!activeConversationId) return
    persistConversations(
      conversations.map((c) =>
        c.id === activeConversationId ? { ...c, messages: [], title: 'New conversation' } : c,
      ),
    )
  }, [activeConversationId, conversations, persistConversations])

  const newConversation = useCallback(() => {
    const conv = createConversation(pageContext)
    persistConversations([conv, ...conversations])
    setActiveConversationId(conv.id)
  }, [pageContext, conversations, persistConversations])

  // Open a past conversation in the current layout (docked, floating or
  // full screen) instead of forcing full screen.
  const loadConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setIsOpen(true)
    if (mode === 'collapsed') setMode('docked')
  }, [mode, setMode])

  const toggleFavorite = useCallback(
    (id: string) => {
      persistConversations(
        conversations.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)),
      )
    },
    [conversations, persistConversations],
  )

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id)
      persistConversations(next)
      if (activeConversationId === id) {
        setActiveConversationId(next[0]?.id ?? null)
      }
    },
    [conversations, persistConversations, activeConversationId],
  )

  const togglePinnedPrompt = useCallback((promptId: string) => {
    setFavoritePromptIds((prev) => {
      const next = new Set(prev)
      if (next.has(promptId)) next.delete(promptId)
      else next.add(promptId)
      return next
    })
  }, [])

  const suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS
  const pinnedPrompts = [
    ...PINNED_PROMPTS,
    ...DEFAULT_SUGGESTED_PROMPTS.filter((p) => favoritePromptIds.has(p.id)),
  ]

  // Global hotkey Ctrl+I
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const value = useMemo<AiCopilotContextValue>(
    () => ({
      isOpen,
      mode,
      panelWidth,
      isGenerating,
      activeConversationId,
      messages,
      conversations,
      pageContext,
      registeredContext,
      suggestedPrompts,
      pinnedPrompts,
      open,
      close,
      toggle,
      setMode,
      setPanelWidth,
      sendMessage,
      stopGeneration,
      retryLast,
      clearConversation,
      setRegisteredContext,
      loadConversation,
      newConversation,
      toggleFavorite,
      togglePinnedPrompt,
      deleteConversation,
      handleMessageAction,
      handleFormSubmit,
      handleFormCancel,
    }),
    [
      isOpen,
      mode,
      panelWidth,
      isGenerating,
      activeConversationId,
      messages,
      conversations,
      pageContext,
      registeredContext,
      suggestedPrompts,
      pinnedPrompts,
      open,
      close,
      toggle,
      setMode,
      setPanelWidth,
      sendMessage,
      stopGeneration,
      retryLast,
      clearConversation,
      loadConversation,
      newConversation,
      toggleFavorite,
      togglePinnedPrompt,
      deleteConversation,
      handleMessageAction,
      handleFormSubmit,
      handleFormCancel,
    ],
  )

  return <AiCopilotContext.Provider value={value}>{children}</AiCopilotContext.Provider>
}

export function useAiCopilot() {
  const ctx = useContext(AiCopilotContext)
  if (!ctx) throw new Error('useAiCopilot must be used within AiCopilotProvider')
  return ctx
}

function serializeAiPageContext(context: AiPageContext | null): string {
  return context ? JSON.stringify(context) : ''
}

export function useRegisterAiContext(context: AiPageContext | null) {
  const { setRegisteredContext } = useAiCopilot()
  const contextKey = serializeAiPageContext(context)

  useEffect(() => {
    setRegisteredContext(context)
    return () => setRegisteredContext(null)
    // Compare serialized context so inline object literals do not retrigger every render.
  }, [contextKey, setRegisteredContext])
}

export { MIN_WIDTH as AI_PANEL_MIN_WIDTH, MAX_WIDTH as AI_PANEL_MAX_WIDTH }
