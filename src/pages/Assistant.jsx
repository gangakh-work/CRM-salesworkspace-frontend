import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'
import MarkdownContent from '../components/MarkdownContent'
import CreateOpportunityModal from '../components/CreateOpportunityModal'
import { PageHead } from '../components/ui'
import { crmApi, salesAgentApi } from '../lib/api'
import { useApp } from '../lib/store'
import { useAuth } from '../auth'
import '../styles/assistant.css'

const HISTORY_KEY = 'glassy-ai-agent-conversations-v2'
const ACTIVE_CONVERSATION_KEY = 'glassy-ai-agent-active-conversation-v1'
const CAPABILITIES = [
  ['summarize-lead', 'Summarize lead'],
  ['summarize-opportunity', 'Summarize opportunity'],
  ['follow-up-email', 'Draft follow-up email'],
  ['meeting-notes', 'Meeting notes'],
  ['win-probability', 'Win probability'],
  ['next-best-action', 'Next best action'],
  ['missing-information', 'Missing information'],
  ['suggest-stage', 'Suggest opportunity stage'],
  ['risk-analysis', 'Risk analysis'],
  ['suggested-tasks', 'Suggested tasks'],
]
const STARTER = 'Hi! I’m your CRM AI Assistant. Ask naturally to find CRM records, create or update leads and opportunities, qualify leads, draft a proposal, or review sales activity. I’ll ask a follow-up if anything important is unclear.'
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`
const now = () => new Date().toISOString()

function readLocalHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function readActiveConversationId() {
  try { return sessionStorage.getItem(ACTIVE_CONVERSATION_KEY) || null } catch { return null }
}
function normaliseMessages(messages = []) {
  return messages.map((m, i) => ({ id: m.id || `loaded-${i}-${Date.now()}`, role: m.role || 'assistant', content: m.content || '', timestamp: m.timestamp || now(), form: m.form, actions: m.actions, table: m.table, cards: m.cards }))
}
function asArray(value) { return Array.isArray(value) ? value : (value?.items || value?.data || value?.conversations || []) }
function getErrorMessage(error) { return error?.message || 'Something went wrong. Please try again.' }
function parseRecordIdSearch(message) {
  const id = message.match(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/i)?.[0]
  if (!id) return null
  const mentionsLead = /\bleads?\b/i.test(message)
  const mentionsOpportunity = /\bopportunit(?:y|ies)\b/i.test(message)
  return { id, kind: mentionsLead === mentionsOpportunity ? null : mentionsLead ? 'lead' : 'opportunity' }
}

function visibleField(field, values) { return !field.showWhen || String(values[field.showWhen.field] ?? '') === String(field.showWhen.equals) }
function initialFormValues(form) {
  return Object.fromEntries((form.fields || []).map(f => [f.name, f.default === undefined ? (f.type === 'checkbox' ? 'false' : '') : String(f.default)]))
}
function optionsFor(field) {
  return (field.options || []).map(option => typeof option === 'string' ? { value: option, label: option } : option)
}
function validateForm(form, values, step) {
  const errors = {}
  ;(form.fields || []).filter(f => (step === undefined || (f.step ?? 0) === step) && visibleField(f, values)).forEach(field => {
    const value = String(values[field.name] ?? '').trim()
    if (field.type === 'checkbox') { if (field.required && value !== 'true') errors[field.name] = `${field.label} is required`; return }
    if (field.required && !value) errors[field.name] = `${field.label} is required`
    if (value && field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) errors[field.name] = 'Enter a valid email address'
    if (value && field.type === 'number') {
      const n = Number(value)
      if (!Number.isFinite(n)) errors[field.name] = 'Enter a valid number'
      else if (field.min !== undefined && n < field.min) errors[field.name] = `Must be at least ${field.min}`
      else if (field.max !== undefined && n > field.max) errors[field.name] = `Must be at most ${field.max}`
    }
  })
  return errors
}
function formSubmitValues(form, values) {
  const output = { ...values }
  ;(form.fields || []).forEach(field => {
    if (field.type === 'datetime-local' && output[field.name]) {
      const parsed = new Date(output[field.name])
      if (!Number.isNaN(parsed.getTime())) output[field.name] = parsed.toISOString()
    }
  })
  return output
}

function InlineAgentForm({ form, disabled, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialFormValues(form))
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const steps = form.steps || []
  const reviewStep = steps.length > 0 ? steps.length - 1 : -1
  const currentFields = (form.fields || []).filter(f => (f.step ?? 0) === step && visibleField(f, values))
  const setValue = (name, value) => { setValues(old => ({ ...old, [name]: value })); setErrors(old => { const n = { ...old }; delete n[name]; return n }) }
  const next = () => { const found = validateForm(form, values, step); setErrors(found); if (!Object.keys(found).length) setStep(s => Math.min(s + 1, reviewStep)) }
  const back = () => setStep(s => Math.max(0, s - 1))
  const submit = async () => {
    const found = validateForm(form, values)
    if (Object.keys(found).length) { setErrors(found); const first = (form.fields || []).find(f => found[f.name]); if (first && steps.length) setStep(first.step ?? 0); return }
    if (form.confirmText && !confirmed) { setErrors({ __confirmed: 'Please confirm before submitting.' }); return }
    setSending(true)
    try { await onSubmit({ ...formSubmitValues(form, values), ...(form.confirmText ? { confirmed: String(confirmed) } : {}) }) }
    finally { setSending(false) }
  }
  const isReview = steps.length > 0 && step === reviewStep
  return <div className="agent-form-card">
    <div className="agent-form-heading"><div><strong>{form.title}</strong>{form.description && <p>{form.description}</p>}</div><span className="agent-form-tag">{steps.length ? `Step ${step + 1}/${steps.length}` : 'CRM form'}</span></div>
    {form.warning && <div className="agent-form-warning">{form.warning}</div>}
    {steps.length > 0 && <div className="agent-stepper">{steps.map((label, i) => <span key={`${label}-${i}`} className={i <= step ? 'active' : ''}/>)}</div>}
    {steps.length > 0 && <div className="agent-step-label">{steps[step]}{form.subtitle ? ` · ${form.subtitle}` : ''}</div>}
    {isReview ? <div className="agent-review"><b>{form.review?.title || 'Review details'}</b>{(form.review?.rows || form.fields.map(f => ({ label: f.label, field: f.name }))).filter(row => !row.showWhen || String(values[row.showWhen.field] ?? '') === String(row.showWhen.equals)).map((row, i) => {
      let value = row.value ?? (row.field ? values[row.field] : '') ?? ''
      const field = (form.fields || []).find(f => f.name === row.field)
      if (field?.type === 'select') value = optionsFor(field).find(o => String(o.value) === String(value))?.label || value
      if (field?.type === 'checkbox') value = value === 'true' ? 'Yes' : 'No'
      if (row.format === 'percent' && value !== '') value = `${value}%`
      if (row.hideIfEmpty && !String(value).trim()) return null
      return <div className="agent-review-row" key={`${row.label}-${i}`}><span>{row.label}</span><strong>{String(value || '—')}</strong></div>
    })}{form.review?.note && <small>{form.review.note}</small>}</div> : <div className="agent-form-grid">{currentFields.map(field => <label key={field.name} className={field.fullWidth || field.type === 'textarea' || field.type === 'checkbox' ? 'wide' : ''}>
      {field.type === 'checkbox' ? <span className="agent-checkbox-label"><input type="checkbox" checked={values[field.name] === 'true'} disabled={disabled || sending} onChange={e => setValue(field.name, e.target.checked ? 'true' : 'false')}/><span>{field.label}{field.required ? ' *' : ''}</span></span> : <><span>{field.label}{field.required ? ' *' : ''}</span>{field.type === 'select' ? <select value={values[field.name] || ''} disabled={disabled || sending} onChange={e => setValue(field.name, e.target.value)}><option value="">{field.placeholder || 'Select…'}</option>{optionsFor(field).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : field.type === 'textarea' ? <textarea rows={field.rows || 3} value={values[field.name] || ''} placeholder={field.placeholder || ''} disabled={disabled || sending} onChange={e => setValue(field.name, e.target.value)}/> : <input type={field.type || 'text'} value={values[field.name] || ''} placeholder={field.placeholder || ''} min={field.min} max={field.max} disabled={disabled || sending} onChange={e => setValue(field.name, e.target.value)}/>}</>}
      {errors[field.name] && <small className="agent-field-error">{errors[field.name]}</small>}
    </label>)}</div>}
    {form.confirmText && isReview && <label className="agent-confirm-check"><input type="checkbox" checked={confirmed} onChange={e => { setConfirmed(e.target.checked); setErrors(old => ({ ...old, __confirmed: '' })) }}/>{form.confirmText}</label>}
    {errors.__confirmed && <small className="agent-field-error">{errors.__confirmed}</small>}
    {Object.keys(errors).length > 0 && !errors.__confirmed && <small className="agent-field-error">Please correct the highlighted fields.</small>}
    <div className="agent-form-actions">{steps.length > 0 && <button type="button" className="agent-secondary" disabled={step === 0 || sending} onClick={back}>Back</button>}{onCancel && <button type="button" className="agent-secondary" disabled={sending} onClick={onCancel}>Cancel</button>}{steps.length > 0 && !isReview ? <button type="button" className="agent-primary" disabled={disabled || sending} onClick={next}>Next <Icon name="arrowRight" size={14}/></button> : <button type="button" className="agent-primary" disabled={disabled || sending || Boolean(form.warning)} onClick={() => void submit()}>{sending ? 'Submitting…' : (form.submitLabel || 'Submit')}</button>}</div>
  </div>
}

function AgentMessage({ message, busy, onAction, onRecordOpen, onFormSubmit, onFormCancel, onCopy, copied }) {
  return <div className={`agent-message ${message.role === 'user' ? 'user' : 'assistant'}`}>
    <div className="agent-message-bubble">
      {message.content && (message.role === 'assistant' ? (
        <MarkdownContent className="agent-message-content">
          {message.cards?.length && /^I found \d+ leads? matching/i.test(message.content.trim())
            ? message.content.trim().split('\n')[0]
            : message.content}
        </MarkdownContent>
      ) : <div className="agent-message-content"><p>{message.content}</p></div>)}
      {message.table && <div className="agent-table-wrap"><table><thead><tr>{(message.table.headers || []).map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{(message.table.rows || []).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
      {message.cards?.map((card, i) => {
        const meta = Array.isArray(card.meta) ? card.meta : []
        const hrefMatch = String(card.href || '').match(/\/(?:workspace\/)?(leads?|opportunities)\/([0-9a-f-]{36})\/?$/i)
        const kind = card.kind || (hrefMatch ? (/^lead/i.test(hrefMatch[1]) ? 'lead' : 'opportunity') : '')
        const recordId = card.id || card.leadid || card.opportunityid || hrefMatch?.[2]
        const canOpen = Boolean(recordId && ['lead', 'opportunity'].includes(kind))
        const cardBody = <><div className="agent-record-card-top"><div><b>{card.title || card.name || 'CRM record'}</b>{card.subtitle && <p>{card.subtitle}</p>}</div>{card.badge && <span className={`agent-record-badge ${card.badge_tone || ''}`}>{card.badge}</span>}</div>{meta.map((item, j) => <p className="agent-record-meta" key={j}>{item.value || item.label || ''}</p>)}{card.description && <p>{card.description}</p>}{card.metadata && Object.entries(card.metadata).map(([k, v]) => <p key={k}><span>{k}: </span>{v}</p>)}{recordId && <small className="agent-record-id">{kind === 'opportunity' ? 'Opportunity' : 'Lead'} ID: {recordId}</small>}{canOpen && <span className="agent-record-open">Open {kind} <Icon name="arrowRight" size={13}/></span>}</>
        return canOpen
          ? <button type="button" className="agent-record-card agent-record-card-link" key={recordId || i} onClick={() => onRecordOpen(kind, recordId)} aria-label={`Open ${kind}: ${card.title || card.name || recordId}`}>{cardBody}</button>
          : <div className="agent-record-card" key={card.id || i}>{cardBody}</div>
      })}
      {message.form && <InlineAgentForm key={message.form.id} form={message.form} disabled={busy} onSubmit={values => onFormSubmit(message.id, message.form.id, values)} onCancel={() => onFormCancel(message.id, message.form.id)}/>}
      {message.actions?.length > 0 && <div className="agent-action-row">{message.actions.map((action, i) => <button key={`${action.id}-${i}`} type="button" className={action.variant === 'primary' ? 'agent-primary' : 'agent-secondary'} disabled={busy} onClick={() => onAction(action.id, message.id, action.url)}>{action.label}</button>)}</div>}
      {message.role === 'assistant' && message.content && <div className="agent-message-tools"><button type="button" className="agent-copy-button" onClick={() => onCopy(message.id, message.content)} aria-label={copied ? 'Response copied' : 'Copy response'}><Icon name={copied ? 'check' : 'copy'} size={13}/><span>{copied ? 'Copied' : 'Copy'}</span></button></div>}
    </div>
    <small className="agent-message-time">{message.role === 'user' ? 'You · ' : ''}{new Date(message.timestamp || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
  </div>
}

export default function Assistant() {
  const { toast, page, recordDetail, go, setRecordDetail, activeDashboardView } = useApp()
  const { profile } = useAuth()
  const userEmail = profile?.mail || profile?.userPrincipalName || ''
  const userName = profile?.displayName || userEmail.split('@')[0] || 'Sales User'
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false)
  const [assistantStatus, setAssistantStatus] = useState(null)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [messages, setMessages] = useState(() => {
    const activeId = readActiveConversationId()
    const saved = activeId && readLocalHistory().find(item => item.id === activeId)
    return saved ? normaliseMessages(saved.messages || []) : [{ id: newId(), role: 'assistant', content: STARTER, timestamp: now() }]
  })
  const [conversationId, setConversationId] = useState(readActiveConversationId)
  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState('')
  const [attachment, setAttachment] = useState([])
  const [listening, setListening] = useState(false)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const context = useMemo(() => {
    const isLead = page === 'lead-detail'
    const isOpportunity = page === 'opportunity-detail'
    const record = recordDetail?.record || recordDetail?.summary || {}
    const entityId = recordDetail?.id || record.leadid || record.opportunityid || record.id
    const entityName = record.fullname || record.name || record.topic || record.subject
    const activeView = activeDashboardView ? {
      active_view: activeDashboardView.label,
      active_filter: activeDashboardView.filter,
      record_scope: JSON.stringify({
        source: 'authenticated Dataverse results',
        entity_type: activeDashboardView.entityType,
        record_ids: activeDashboardView.recordIds,
      }),
      record_count: String(activeDashboardView.recordIds.length),
    } : undefined
    return {
      page: page || 'ai-assistant',
      page_label: activeDashboardView ? `AI Assistant — ${activeDashboardView.label}` : 'AI Assistant',
      ...(isLead || isOpportunity ? {
        entity_type: isLead ? 'lead' : 'opportunity',
        ...(entityId ? { entity_id: entityId } : {}),
        ...(entityName ? { entity_name: entityName } : {}),
      } : activeDashboardView ? { entity_type: activeDashboardView.entityType } : {}),
      ...(activeView ? { metadata: activeView } : {}),
    }
  }, [page, recordDetail, activeDashboardView])

  const persistLocal = useCallback((nextMessages, id = conversationId) => {
    if (!id) return
    const all = readLocalHistory().filter(c => c.id !== id)
    all.unshift({ id, title: (nextMessages.find(m => m.role === 'user')?.content || 'New conversation').slice(0, 64), messages: nextMessages, updated_at: now() })
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 50))) } catch { /* browser storage quota */ }
  }, [conversationId])
  const append = useCallback((message, id = conversationId) => {
    setMessages(old => { const next = [...old, { id: newId(), timestamp: now(), ...message }]; persistLocal(next, id); return next })
  }, [conversationId, persistLocal])

  const refreshHistory = useCallback(async () => {
    try {
      const server = asArray(await crmApi.assistantConversations())
      const local = readLocalHistory()
      const merged = [...server.map(c => ({ ...c, source: 'server' })), ...local.filter(l => !server.some(s => s.id === l.id)).map(c => ({ ...c, source: 'local' }))]
      merged.sort((a, b) => new Date(b.updated_at || b.updatedAt || b.created_at || 0) - new Date(a.updated_at || a.updatedAt || a.created_at || 0))
      setHistory(merged)
      setHistoryError('')
    } catch (error) {
      const local = readLocalHistory(); setHistory(local); setHistoryError(local.length ? 'Showing locally saved conversations; server history is temporarily unavailable.' : getErrorMessage(error))
    }
  }, [])

  useEffect(() => {
    let alive = true
    crmApi.assistantStatus().then(v => { if (alive) setAssistantStatus(v) }).catch(() => { if (alive) setAssistantStatus({ status: 'unavailable' }) })
    Promise.resolve().then(() => { if (alive) void refreshHistory() })
    return () => { alive = false }
  }, [refreshHistory])
  useEffect(() => {
    try {
      if (conversationId) sessionStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId)
      else sessionStorage.removeItem(ACTIVE_CONVERSATION_KEY)
    } catch (error) {
      console.debug('Active assistant conversation could not be saved for this tab', error)
    }
  }, [conversationId])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  useEffect(() => () => {
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
  }, [])

  const newConversation = () => {
    setConversationId(null); setAttachment([])
    setMessages([{ id: newId(), role: 'assistant', content: 'New conversation started. Ask naturally to manage a lead or opportunity, draft a proposal, or explore sales insights.', timestamp: now() }])
  }
  const openConversation = async item => {
    try {
      if (item.source === 'local' || item.messages) {
        setConversationId(item.id); setMessages(normaliseMessages(item.messages || [])); return
      }
      const detail = await crmApi.assistantConversation(item.id)
      const restored = normaliseMessages(detail.messages || [])
      setConversationId(detail.id); setMessages(restored); persistLocal(restored, detail.id)
    } catch (error) { toast({ icon: 'sparkle', title: 'Unable to open conversation', text: getErrorMessage(error) }) }
  }
  const openRecord = (kind, id) => {
    if (!id || !['lead', 'opportunity'].includes(kind)) return
    setRecordDetail({ id, summary: { id, ...(kind === 'lead' ? { leadid: id } : { opportunityid: id }) } })
    go(kind === 'lead' ? 'lead-detail' : 'opportunity-detail')
  }
  const copyResponse = async (messageId, content) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content)
      } else {
        const copyField = document.createElement('textarea')
        copyField.value = content
        copyField.setAttribute('readonly', '')
        copyField.style.position = 'fixed'
        copyField.style.opacity = '0'
        document.body.appendChild(copyField)
        copyField.select()
        const copied = document.execCommand('copy')
        copyField.remove()
        if (!copied) throw new Error('Clipboard access is unavailable in this browser.')
      }
      setCopiedMessageId(messageId)
      window.setTimeout(() => setCopiedMessageId(current => current === messageId ? null : current), 1800)
    } catch (error) {
      toast({ icon: 'sparkle', title: 'Unable to copy response', text: getErrorMessage(error) })
    }
  }
  const toggleVoiceInput = () => {
    if (listening) {
      recognitionRef.current?.stop?.()
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({ icon: 'sparkle', title: 'Voice input is unavailable', text: 'Use a browser that supports speech recognition, or type your request.' })
      return
    }
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      toast({ icon: 'sparkle', title: 'Voice input requires a secure connection', text: 'Open this CRM over HTTPS to use your microphone.' })
      return
    }
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => setListening(true)
    recognition.onresult = event => {
      const transcript = Array.from(event.results || [])
        .filter(result => result.isFinal)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim()
      if (transcript) setInput(current => `${current}${current.trim() ? ' ' : ''}${transcript}`)
    }
    recognition.onerror = event => {
      const reasons = {
        'not-allowed': 'Allow microphone access in your browser, then try again.',
        'service-not-allowed': 'This browser does not allow speech recognition.',
        'audio-capture': 'No microphone is available.',
        network: 'Speech recognition could not connect. Check your connection.',
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ icon: 'sparkle', title: 'Voice input failed', text: reasons[event.error] || 'Try again or type your request.' })
      }
      setListening(false)
      recognitionRef.current = null
    }
    recognition.onend = () => {
      setListening(false)
      if (recognitionRef.current === recognition) recognitionRef.current = null
    }
    try { recognition.start() } catch {
      recognitionRef.current = null
      setListening(false)
      toast({ icon: 'sparkle', title: 'Voice input could not start', text: 'Check microphone access and try again.' })
    }
  }
  const startCommand = async (message, files = [], cap = '') => {
    if (busy || (!message.trim() && files.length === 0)) return
    const requestText = message.trim()
    const asksForProposal = /\b(?:proposals?|quotations?|quotes?)\b/i.test(requestText)
    const createOpportunityIntent = !files.length && !asksForProposal && /\b(create|new|add|raise)\b.{0,45}\b(opportunit(y|ies))\b|\b(opportunit(y|ies))\b.{0,35}\b(create|new|add)\b/i.test(requestText)
    if (createOpportunityIntent) {
      const cid = conversationId || newId()
      setConversationId(cid)
      const userMsg = { id: newId(), role: 'user', content: message.trim(), timestamp: now() }
      const assistantMsg = { id: newId(), role: 'assistant', content: 'Please complete the shared Create Opportunity form below. Your opportunity will be saved to Dynamics 365 when you submit it.', timestamp: now() }
      const nextMessages = [...messages, userMsg, assistantMsg]
      setMessages(nextMessages)
      persistLocal(nextMessages, cid)
      setInput('')
      setAttachment([])
      setShowCreateOpportunity(true)
      return
    }
    if (!userEmail) { toast({ icon: 'sparkle', title: 'Microsoft profile is still loading', text: 'Wait for your signed-in work email to appear, then try again.' }); return }
    setBusy(true)
    let cid = conversationId || newId(); setConversationId(cid)
    const userText = message.trim() || `Please analyse ${files.map(f => f.name).join(', ')}`
    const userMsg = { id: newId(), role: 'user', content: userText + (files.length ? `\nAttachments: ${files.map(f => f.name).join(', ')}` : ''), timestamp: now() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages); persistLocal(nextMessages, cid); setInput(''); setAttachment([])
    try {
      let fileContext = ''
      if (files.length) {
        const extracted = await Promise.all(files.map(file => salesAgentApi.upload(file, userEmail)))
        fileContext = extracted.map(item => `\n\n--- Uploaded file: ${item.filename || 'document'} ---\n${item.text || ''}`).join('\n')
      }
      const viewScopePrompt = activeDashboardView
        ? `\n\nActive CRM view: ${activeDashboardView.label} (${activeDashboardView.filter}). Restrict any list analysis to these records returned by the signed-in user's CRM query; do not broaden the scope. Record IDs: ${activeDashboardView.recordIds.join(', ') || 'none'}`
        : ''
      const effectiveMessage = `${userText}${fileContext}${cap ? `\n\nRequested capability: ${cap}` : ''}${viewScopePrompt}`
      const idSearch = files.length ? null : parseRecordIdSearch(userText)
      if (idSearch) {
        const kinds = idSearch.kind ? [idSearch.kind] : ['lead', 'opportunity']
        let result
        let kind
        let lastNotFound
        for (const candidate of kinds) {
          try {
            result = candidate === 'lead' ? await crmApi.lead(idSearch.id) : await crmApi.opportunity(idSearch.id)
            kind = candidate
            break
          } catch (error) {
            if (!/(?:\b404\b|not found)/i.test(getErrorMessage(error))) throw error
            lastNotFound = error
          }
        }
        if (!result || !kind) {
          if (lastNotFound) {
            append({ role: 'assistant', content: `No lead or opportunity was found with CRM ID \`${idSearch.id}\`.` }, cid)
            return
          }
          throw new Error(`No CRM record was found with ID ${idSearch.id}.`)
        }
        const record = result?.data || result?.record || result
        const title = kind === 'lead'
          ? record.fullname || [record.firstname, record.lastname].filter(Boolean).join(' ') || record.name || 'Lead'
          : record.name || record.topic || record.opportunityname || 'Opportunity'
        const subtitle = kind === 'lead'
          ? record.companyname || record.subject || record.jobtitle || ''
          : record.customerid_name || record.stepname || ''
        append({
          role: 'assistant',
          content: `Found ${kind} **${title}** for CRM ID \`${idSearch.id}\`. Select the result to open its details.`,
          cards: [{ id: idSearch.id, kind, title, subtitle, badge: record.statuscode_label || record.status_label || record.stepname || '', meta: subtitle ? [{ value: subtitle }] : [] }],
        }, cid)
        return
      }
      const agent = await salesAgentApi.command({
        message: effectiveMessage,
        conversation_id: cid,
        user_name: userName,
        context: context.entity_type ? context : undefined,
        history: messages.slice(-12).map(item => ({ role: item.role, content: item.content, cards: item.cards })),
      }, userEmail)
      if (agent.handled !== false) {
        append({ role: 'assistant', content: agent.reply || 'I have processed your request.', form: agent.form || undefined, actions: agent.actions || undefined, table: agent.table || undefined, cards: agent.cards || undefined }, cid)
      } else {
        const response = await crmApi.assistantChat({ message: effectiveMessage, conversation_id: cid, context, user_name: userName, history: nextMessages.map(m => ({ role: m.role, content: m.content })) })
        const returned = response.message?.content || response.content || 'I could not generate a response.'
        cid = response.conversation_id || cid; setConversationId(cid)
        append({ role: 'assistant', content: returned }, cid)
      }
      window.dispatchEvent(new CustomEvent('crm:assistant-data-changed'))
      void refreshHistory()
    } catch (error) {
      append({ role: 'assistant', content: `I couldn't complete that request: ${getErrorMessage(error)}\n\nPlease check that the CRM backend is running and that your Microsoft session has access.` }, cid)
      toast({ icon: 'sparkle', title: 'Assistant request failed', text: getErrorMessage(error) })
    } finally { setBusy(false) }
  }
  const send = e => { e?.preventDefault?.(); void startCommand(input, attachment) }

  const submitForm = async (messageId, formId, values) => {
    if (!conversationId) return
    setBusy(true)
    try {
      const result = await salesAgentApi.submitForm({ form_id: formId, conversation_id: conversationId, values, user_name: userName }, userEmail)
      setMessages(old => {
        const updated = old.map(m => m.id === messageId ? { ...m, form: result.keep_form ? (result.form || m.form) : undefined } : m)
        const next = [...updated, { id: newId(), role: 'assistant', content: result.reply || 'Form submitted.', timestamp: now(), actions: result.actions, table: result.table, form: result.form, cards: result.cards }]
        persistLocal(next); return next
      })
      if (!result.keep_form) window.dispatchEvent(new CustomEvent('crm:assistant-data-changed'))
      void refreshHistory()
    } catch (error) {
      append({ role: 'assistant', content: `Unable to submit the form: ${getErrorMessage(error)}` })
      toast({ icon: 'sparkle', title: 'Form submission failed', text: getErrorMessage(error) })
    } finally { setBusy(false) }
  }
  const cancelForm = async (messageId) => {
    setMessages(old => { const next = old.map(m => m.id === messageId ? { ...m, form: undefined } : m); persistLocal(next); return next })
    append({ role: 'assistant', content: 'Cancelled. No CRM changes were made.' })
    if (conversationId && userEmail) { try { await salesAgentApi.command({ message: 'cancel', conversation_id: conversationId, user_name: userName }, userEmail) } catch { /* the form is already closed locally */ } }
  }
  const handleAction = async (actionId, messageId, actionUrl) => {
    if (actionUrl) { window.open(actionUrl, '_blank', 'noopener,noreferrer'); return }
    const [kind, ...rest] = String(actionId).split(':'); const token = rest[0]; const format = rest[1] || 'docx'
    if (kind === 'prompt' && token) { void startCommand(token); return }
    if (kind === 'convert' && token) { void startCommand(`convert lead ${token}`); return }
    if (kind === 'download' && token) { try { await salesAgentApi.downloadDocument(token, userEmail) } catch (error) { toast({ icon: 'sparkle', title: 'Unable to download document', text: getErrorMessage(error) }) } return }
    if (kind === 'record-document' && token) { try { await salesAgentApi.downloadDocument(token, userEmail) } catch (error) { toast({ icon: 'sparkle', title: 'Unable to download proposal', text: getErrorMessage(error) }) } return }
    if (kind === 'proposal-download' && token) { try { await salesAgentApi.downloadProposal(token, userEmail, format) } catch (error) { toast({ icon: 'sparkle', title: `Unable to download proposal ${format.toUpperCase()}`, text: getErrorMessage(error) }) } return }
    if ((kind !== 'confirm' && kind !== 'cancel') || !token) return
    setBusy(true)
    try {
      const result = kind === 'confirm' ? await salesAgentApi.confirm(token, userEmail) : await salesAgentApi.cancel(token, userEmail)
      setMessages(old => {
        const updated = old.map(m => m.id === messageId ? { ...m, actions: (m.actions || []).filter(a => !/^(confirm|cancel):/.test(a.id)) } : m)
        const next = [...updated, { id: newId(), role: 'assistant', content: result.message || (kind === 'confirm' ? 'Action completed.' : 'Action cancelled.'), timestamp: now(), actions: result.actions, table: result.table, form: result.form }]
        persistLocal(next); return next
      })
      if (kind === 'confirm' && result.success) window.dispatchEvent(new CustomEvent('crm:assistant-data-changed'))
      void refreshHistory()
    } catch (error) { toast({ icon: 'sparkle', title: 'CRM action failed', text: getErrorMessage(error) }) }
    finally { setBusy(false) }
  }
  const runCapability = async name => {
    if (busy) return
    setBusy(true)
    const cid = conversationId || newId(); setConversationId(cid)
    const labels = Object.fromEntries(CAPABILITIES)
    const userMessage = `Run capability: ${labels[name] || name}`
    const next = [...messages, { id: newId(), role: 'user', content: userMessage, timestamp: now() }]
    setMessages(next); persistLocal(next, cid)
    try {
      const result = await crmApi.assistantCapability(name, { conversation_id: cid, context, user_name: userName })
      append({ role: 'assistant', content: result.content || 'No response was returned.' }, result.conversation_id || cid)
      void refreshHistory()
    } catch (error) { append({ role: 'assistant', content: `Unable to run ${labels[name] || name}: ${getErrorMessage(error)}` }, cid); toast({ icon: 'sparkle', title: 'Capability unavailable', text: getErrorMessage(error) }) }
    finally { setBusy(false) }
  }

  return <>
    <PageHead title="AI Assistant" sub="Your sales workspace copilot" />
    <div className="glassy-assistant-layout">
      <section className="glassy-assistant-chat card">
        <div className="glassy-assistant-head"><span className="assistant-avatar"><Icon name="sparkle" size={18}/></span><div className="assistant-title"><b>Glassy CRM Assistant</b><small>Sales Agent API · {assistantStatus?.status || (assistantStatus?.available === true ? 'Connected' : assistantStatus?.available === false ? 'Unavailable' : 'Checking status…')}</small></div><button type="button" className="chip assistant-new-chat" onClick={newConversation}>New chat</button></div>
        {activeDashboardView && <div className="assistant-scope-note" role="status"><Icon name="target" size={14}/><span>Using {activeDashboardView.label} · {activeDashboardView.recordIds.length} CRM records in scope</span></div>}
        <div className="glassy-assistant-thread" aria-live="polite">{messages.map(message => <AgentMessage key={message.id} message={message} busy={busy} onAction={handleAction} onRecordOpen={openRecord} onFormSubmit={submitForm} onFormCancel={cancelForm} onCopy={(messageId, content) => { void copyResponse(messageId, content) }} copied={copiedMessageId === message.id}/>)}{busy && <div className="agent-thinking"><span/><span/><span/> Working on your CRM request…</div>}<div ref={messagesEndRef}/></div>
        <div className="glassy-assistant-composer">
          <div className="assistant-quick-prompts">{['Create a lead', 'Create an opportunity', 'Draft a proposal', 'Show my overdue tasks', 'Suggest next best actions'].map(prompt => <button type="button" className="chip" key={prompt} disabled={busy} onClick={() => prompt === 'Create an opportunity' ? void startCommand(prompt) : setInput(prompt)}>{prompt}</button>)}</div>
          <div className="assistant-attachment-row"><input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt,.md,.csv,.xls,.xlsx" hidden onChange={e => setAttachment(Array.from(e.target.files || []))}/><button type="button" className="chip" onClick={() => fileInputRef.current?.click()} disabled={busy}><Icon name="clip" size={15}/> Attach files</button><small>PDF, DOCX, XLS, XLSX, CSV, TXT, MD</small>{attachment.map(file => <span className="assistant-file-pill" key={`${file.name}-${file.size}`}>{file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setAttachment(old => old.filter(f => f !== file))}>×</button></span>)}</div>
          <form className="assistant-input-form" onSubmit={send}><textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask naturally, e.g. ‘Draft a proposal for the selected opportunity’…" rows={2} disabled={busy} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }}/><button type="button" className={`assistant-voice-button${listening ? ' listening' : ''}`} onClick={toggleVoiceInput} disabled={busy} aria-label={listening ? 'Stop voice input' : 'Start voice input'} aria-pressed={listening}><Icon name={listening ? 'close' : 'mic'} size={17}/></button>{busy ? <button type="button" className="cta" onClick={() => toast({ icon: 'sparkle', title: 'Working', text: 'The current CRM action is being processed.' })}>Working…</button> : <button className="cta" type="submit" disabled={!input.trim() && attachment.length === 0}><Icon name="arrowRight" size={16}/> Send</button>}</form>
          {listening && <small className="assistant-voice-status" role="status">Listening… Speak your CRM request, then review and send it.</small>}
        </div>
      </section>
      <aside className="glassy-assistant-side card" aria-label="Assistant tools and conversation history">
        <section className="assistant-side-section assistant-capabilities-section">
          <div className="assistant-side-heading"><b>Sales capabilities</b><span>{CAPABILITIES.length}</span></div>
          <div className="assistant-capability-list">{CAPABILITIES.map(([id, label]) => <button type="button" className="chip" key={id} disabled={busy} onClick={() => runCapability(id)}>{label}</button>)}</div>
          <div className="assistant-crm-hint"><b>Conversational CRM actions</b><p>Create leads and opportunities, qualify or disqualify leads, convert records, and mark opportunities won or lost directly in chat.</p></div>
        </section>
        <section className="assistant-side-section assistant-history-section">
          <div className="assistant-side-heading"><b>Recent conversations</b><button type="button" className="assistant-history-refresh" onClick={() => void refreshHistory()} title="Refresh history"><Icon name="refresh" size={13}/></button></div>
          <div className="assistant-history-list">{historyError && <small className="assistant-history-error">{historyError}</small>}{history.length ? history.map(item => <div className={`assistant-history-item${conversationId === item.id ? ' current' : ''}`} key={item.id}><button type="button" onClick={() => void openConversation(item)}><b>{item.title || 'Conversation'}</b><small>{item.message_count ?? item.messages?.length ?? 0} messages · {new Date(item.updated_at || item.updatedAt || item.created_at || 0).toLocaleDateString()}</small></button><button type="button" className="assistant-history-delete" title="Delete conversation" onClick={async () => { try { if (item.source !== 'local') await salesAgentApi.deleteConversation(item.id, userEmail); const next = readLocalHistory().filter(c => c.id !== item.id); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); if (conversationId === item.id) newConversation(); await refreshHistory() } catch (error) { toast({ icon: 'sparkle', title: 'Unable to delete conversation', text: getErrorMessage(error) }) } }}>×</button></div>) : <p className="assistant-history-empty">Your previous conversations will appear here.</p>}</div>
        </section>
      </aside>
    </div>
  {showCreateOpportunity && <CreateOpportunityModal
    onClose={() => setShowCreateOpportunity(false)}
    onCreated={() => {
      setShowCreateOpportunity(false)
      append({ role: 'assistant', content: 'Opportunity created successfully in Dynamics 365.' })
      window.dispatchEvent(new CustomEvent('crm:assistant-data-changed'))
      void refreshHistory()
    }}
  />}
  </>
}
