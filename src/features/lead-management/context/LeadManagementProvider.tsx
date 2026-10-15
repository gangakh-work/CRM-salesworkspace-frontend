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
import { toast as sonnerToast } from 'sonner'

import { STORAGE_KEYS } from '@/config/constants'
import { SAVED_VIEWS } from '@/features/lead-management/config/saved-views.config'
import { useCrmFilterOptions } from '@/features/crm-workspace/hooks/useCrmFilterOptions'
import type { CreateLeadResultDto } from '@/features/lead-management/domain/lead.dto'
import type { QualifyLeadResultDto } from '@/features/lead-management/domain/qualification.dto'
import type { DisqualifyLeadResultDto } from '@/features/lead-management/domain/disqualification.dto'
import type { ConvertLeadResultDto } from '@/features/lead-management/domain/conversion.dto'
import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import type { LeadDraft } from '@/features/lead-management/lib/lead-drafts'
import { leadService } from '@/features/lead-management/services/lead.service'
import { LeadApi } from '@/features/lead-management/api/LeadApi'
import {
  mergeLeadIntoListCache,
  mergeLeadsWithServer,
  updateLeadInListCache,
  useLeadsQuery,
  type LeadsListCache,
} from '@/features/lead-management/hooks/useLeadQueries'
import {
  canTransition,
  formatWorkflowStatus,
  workflowToKanban,
} from '@/features/lead-management/lib/lead-workflow'
import type {
  ConfirmDialogState,
  Lead,
  LeadActivity,
  LeadExtras,
  LeadFilters,
  LeadGroupBy,
  LeadTimelineEvent,
  LeadViewMode,
  LeadWorkflowStatus,
  SavedView,
} from '@/features/lead-management/types/lead.types'
import {
  DEFAULT_LEAD_FILTERS,
  LEAD_COLUMNS,
} from '@/features/lead-management/types/lead.types'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { semanticMatches } from '@/lib/semantic-search'

type UndoEntry = { id: string; undo: () => void }

let eventCounter = 0
function nextId(prefix: string) {
  eventCounter += 1
  return `${prefix}-${Date.now()}-${eventCounter}`
}

const CONVERSION_STORAGE_KEY = 'sales-workspace:lead-conversions'
type StoredConversion = {
  opportunityId: string
  convertedDate: string
  convertedBy: string
  opportunityName?: string
}

function loadStoredConversions(): Record<string, StoredConversion> {
  try {
    const raw = localStorage.getItem(CONVERSION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, StoredConversion>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveStoredConversion(lead: Lead, conversion: StoredConversion) {
  try {
    const stored = loadStoredConversions()
    stored[lead.id] = conversion
    localStorage.setItem(CONVERSION_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    /* ignore storage failures */
  }
}

function applyStoredConversions(leads: Lead[]): Lead[] {
  const stored = loadStoredConversions()
  return leads.map((lead) => {
    const conversion = stored[lead.id]
    if (!conversion || lead.status === 'disqualified') return lead
    return {
      ...lead,
      status: 'converted',
      convertedOpportunityId: conversion.opportunityId,
      convertedDate: conversion.convertedDate,
      convertedBy: conversion.convertedBy,
      opportunityName: conversion.opportunityName ?? lead.opportunityName,
    }
  })
}

interface LeadManagementContextValue {
  leads: Lead[]
  leadExtras: Record<string, LeadExtras>
  filteredLeads: Lead[]
  paginatedLeads: Lead[]
  viewMode: LeadViewMode
  searchQuery: string
  filters: LeadFilters
  groupBy: LeadGroupBy
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  visibleColumns: string[]
  columnWidths: Record<string, number>
  selectedIds: Set<string>
  page: number
  pageSize: number
  totalPages: number
  selectedLead: Lead | null
  selectedLeadExtras: LeadExtras | null
  drawerOpen: boolean
  wizardOpen: boolean
  qualifyWizardOpen: boolean
  qualifyLeadId: string | null
  disqualifyWizardOpen: boolean
  disqualifyLeadId: string | null
  convertWizardOpen: boolean
  convertLeadId: string | null
  filtersOpen: boolean
  activeSavedView: string
  showDrafts: boolean
  confirmDialog: ConfirmDialogState | null
  setViewMode: (mode: LeadViewMode) => void
  setSearchQuery: (q: string) => void
  setFilters: (f: LeadFilters) => void
  setGroupBy: (g: LeadGroupBy) => void
  setSort: (column: string, direction: 'asc' | 'desc') => void
  toggleSort: (column: string) => void
  setVisibleColumns: (cols: string[]) => void
  setColumnWidth: (col: string, width: number) => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setPage: (p: number) => void
  setPageSize: (size: number) => void
  openLead: (lead: Lead) => void
  closeDrawer: () => void
  openWizard: (draft?: LeadDraft) => void
  draftToEdit: LeadDraft | null
  closeWizard: () => void
  openQualifyWizard: (leadId: string) => void
  closeQualifyWizard: () => void
  openDisqualifyWizard: (leadId: string) => void
  closeDisqualifyWizard: () => void
  openConvertWizard: (leadId: string) => void
  closeConvertWizard: () => void
  setFiltersOpen: (open: boolean) => void
  setShowDrafts: (show: boolean) => void
  applySavedView: (view: SavedView) => void
  showConfirm: (dialog: ConfirmDialogState) => void
  hideConfirm: () => void
  transitionStatus: (leadId: string, status: LeadWorkflowStatus) => void
  assignOwner: (leadId: string, owner: string) => void
  addNote: (leadId: string, content: string) => void
  logCall: (leadId: string) => void
  sendEmail: (leadId: string, subject?: string) => void
  scheduleMeeting: (leadId: string, title?: string) => void
  createTask: (leadId: string, subject?: string) => void
  sendProposal: (leadId: string, title?: string) => void
  bulkDelete: () => void
  bulkUpdateStatus: (status: LeadWorkflowStatus) => void
  bulkAssignOwner: (owner: string) => void
  bulkExport: () => void
  addLead: (data: CreateLeadInput, owner: string) => Promise<Lead>
  syncCreatedLead: (result: CreateLeadResultDto) => void | Promise<void>
  syncQualifiedLead: (result: QualifyLeadResultDto) => void
  syncDisqualifiedLead: (result: DisqualifyLeadResultDto) => void
  syncConvertedLead: (result: ConvertLeadResultDto) => void
  refresh: () => Promise<void>
  isRefreshing: boolean
  isLoading: boolean
  loadError: string | null
  filterOptions: {
    owners: string[]
    industries: string[]
    sources: string[]
    countries: string[]
  }
}

const LeadManagementContext = createContext<LeadManagementContextValue | null>(null)

function loadViewMode(): LeadViewMode {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.leadViewMode)
    if (v) return v as LeadViewMode
  } catch {
    /* ignore */
  }
  return 'table'
}

function loadVisibleColumns(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.leadColumns)
    if (stored) return JSON.parse(stored) as string[]
  } catch {
    /* ignore */
  }
  return LEAD_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)
}

export function LeadManagementProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const leadsQuery = useLeadsQuery()
  const filterOptionsQuery = useCrmFilterOptions()
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadExtras, setLeadExtras] = useState<Record<string, LeadExtras>>({})
  const isLoading = leadsQuery.isLoading
  const loadError = leadsQuery.isError ? (leadsQuery.error as Error).message : null
  const [viewMode, setViewModeState] = useState<LeadViewMode>(loadViewMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_LEAD_FILTERS)
  const [groupBy, setGroupBy] = useState<LeadGroupBy>('none')
  const [sortColumn, setSortColumn] = useState('createdDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [visibleColumns, setVisibleColumnsState] = useState(loadVisibleColumns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [draftToEdit, setDraftToEdit] = useState<LeadDraft | null>(null)
  const [qualifyWizardOpen, setQualifyWizardOpen] = useState(false)
  const [qualifyLeadId, setQualifyLeadId] = useState<string | null>(null)
  const [disqualifyWizardOpen, setDisqualifyWizardOpen] = useState(false)
  const [disqualifyLeadId, setDisqualifyLeadId] = useState<string | null>(null)
  const [convertWizardOpen, setConvertWizardOpen] = useState(false)
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeSavedView, setActiveSavedView] = useState('all-leads')
  const [showDrafts, setShowDrafts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const undoStack = useRef<UndoEntry[]>([])

  const showConfirm = useCallback((dialog: ConfirmDialogState) => setConfirmDialog(dialog), [])
  const hideConfirm = useCallback(() => setConfirmDialog(null), [])

  const loadFromRepository = useCallback(async () => {
    const result = await leadsQuery.refetch()
    const payload = result.data
    if (payload) {
      setLeads((prev) => applyStoredConversions(mergeLeadsWithServer(prev, payload.leads)))
      setLeadExtras((prev) => {
        const merged = { ...payload.leadExtras }
        for (const [id, extras] of Object.entries(prev)) {
          if (!merged[id]) merged[id] = extras
        }
        return merged
      })
    }
    return payload ?? { leads: [], leadExtras: {} }
  }, [leadsQuery])

  useEffect(() => {
    if (!leadsQuery.data) return
    setLeads((prev) => applyStoredConversions(mergeLeadsWithServer(prev, leadsQuery.data!.leads)))
    setLeadExtras((prev) => {
      const merged = { ...leadsQuery.data!.leadExtras }
      for (const [id, extras] of Object.entries(prev)) {
        if (!merged[id]) merged[id] = extras
      }
      return merged
    })
  }, [leadsQuery.data])

  useEffect(() => {
    setIsRefreshing(leadsQuery.isFetching && !leadsQuery.isLoading)
  }, [leadsQuery.isFetching, leadsQuery.isLoading])

  const invalidateLiveCrm = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
  }, [queryClient])

  const syncLeadToQueryCache = useCallback(
    (lead: Lead, extras: LeadExtras) => {
      queryClient.setQueryData(queryKeys.leads.detail(lead.id), { lead, extras })
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        updateLeadInListCache(current, lead, extras),
      )
    },
    [queryClient],
  )

  const syncCreatedLead = useCallback(
    (result: CreateLeadResultDto) => {
      const { lead, extras } = result
      setLeads((prev) => (prev.some((item) => item.id === lead.id) ? prev : [lead, ...prev]))
      setLeadExtras((prev) => ({ ...prev, [lead.id]: extras }))
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        mergeLeadIntoListCache(current, lead, extras),
      )
      queryClient.setQueryData(queryKeys.leads.detail(lead.id), { lead, extras })
      setWizardOpen(false)
      invalidateLiveCrm()
    },
    [invalidateLiveCrm, queryClient],
  )

  const pushUndo = useCallback((message: string, undo: () => void) => {
    const entry: UndoEntry = { id: nextId('undo'), undo }
    undoStack.current.push(entry)
    sonnerToast.success(message, {
      action: {
        label: 'Undo',
        onClick: () => {
          undo()
          undoStack.current = undoStack.current.filter((e) => e.id !== entry.id)
          sonnerToast.info('Action undone')
        },
      },
    })
  }, [])

  const appendTimeline = useCallback((leadId: string, event: Omit<LeadTimelineEvent, 'id'>) => {
    const evt: LeadTimelineEvent = { id: nextId('evt'), ...event }
    setLeadExtras((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        timeline: [evt, ...(prev[leadId]?.timeline ?? [])].sort((a, b) =>
          b.timestamp.localeCompare(a.timestamp),
        ),
      },
    }))
  }, [])

  const appendActivity = useCallback((leadId: string, activity: Omit<LeadActivity, 'id'>) => {
    const act: LeadActivity = { id: nextId('act'), ...activity }
    setLeadExtras((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        activities: [act, ...(prev[leadId]?.activities ?? [])],
      },
    }))
  }, [])

  const updateLead = useCallback((leadId: string, updater: (lead: Lead) => Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updater(l) : l)))
  }, [])

  const resolvedSelectedLead = useMemo(() => {
    if (!selectedLead) return null
    return leads.find((l) => l.id === selectedLead.id) ?? selectedLead
  }, [leads, selectedLead])

  const selectedLeadExtras = useMemo(() => {
    if (!resolvedSelectedLead) return null
    return leadExtras[resolvedSelectedLead.id] ?? null
  }, [resolvedSelectedLead, leadExtras])

  const setViewMode = useCallback((mode: LeadViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEYS.leadViewMode, mode)
    } catch {
      /* ignore */
    }
  }, [])

  const setVisibleColumns = useCallback((cols: string[]) => {
    setVisibleColumnsState(cols)
    try {
      localStorage.setItem(STORAGE_KEYS.leadColumns, JSON.stringify(cols))
    } catch {
      /* ignore */
    }
  }, [])

  const setColumnWidth = useCallback((col: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [col]: width }))
  }, [])

  const filteredLeads = useMemo(() => {
    let result = [...leads]

    if (searchQuery.trim()) {
      result = result.filter((l) =>
        semanticMatches(searchQuery, [
          l.id,
          l.name,
          l.company,
          l.email,
          l.industry,
          l.title,
          l.opportunityName,
          l.owner,
          l.description,
        ]),
      )
    }

    if (filters.status.length) result = result.filter((l) => filters.status.includes(l.status))
    if (filters.priority.length) result = result.filter((l) => filters.priority.includes(l.priority))
    if (filters.industry.length) result = result.filter((l) => filters.industry.includes(l.industry))
    if (filters.country.length) result = result.filter((l) => filters.country.includes(l.country))
    if (filters.owner.length) result = result.filter((l) => filters.owner.includes(l.owner))
    if (filters.source.length) result = result.filter((l) => filters.source.includes(l.source))
    result = result.filter((l) => l.score >= filters.scoreMin && l.score <= filters.scoreMax)

    result.sort((a, b) => {
      const aVal = a[sortColumn as keyof Lead]
      const bVal = b[sortColumn as keyof Lead]
      if (aVal === undefined || bVal === undefined) return 0
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [leads, searchQuery, filters, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))

  const paginatedLeads = useMemo(() => {
    if (viewMode !== 'table') return filteredLeads
    const start = (page - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [filteredLeads, page, pageSize, viewMode])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const toggleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    },
    [sortColumn],
  )

  const setSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
  }, [])

  const openLead = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedLead(null), 300)
  }, [])

  const applySavedView = useCallback((view: SavedView) => {
    setFilters(view.filters)
    setGroupBy(view.groupBy)
    setSortColumn(view.sortColumn)
    setSortDirection(view.sortDirection)
    setActiveSavedView(view.id)
    setPage(1)
  }, [])

  const transitionStatus = useCallback(
    (leadId: string, status: LeadWorkflowStatus) => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead || lead.status === status) return
      if (lead.status !== status && !canTransition(lead.status, status)) {
        sonnerToast.error(`Cannot move from ${formatWorkflowStatus(lead.status)} to ${formatWorkflowStatus(status)}`)
        return
      }

      const prevStatus = lead.status
      const today = new Date().toISOString().slice(0, 10)

      updateLead(leadId, (l) => ({
        ...l,
        status,
        kanbanColumn: workflowToKanban(status),
        lastActivity: today,
      }))

      void LeadApi.updateLeadStatus(leadId, status)
        .then((updated) => {
          updateLead(leadId, () => ({
            ...updated,
            kanbanColumn: workflowToKanban(status),
            lastActivity: today,
          }))
          const extras = leadExtras[leadId]
          if (extras) syncLeadToQueryCache({ ...updated, status, kanbanColumn: workflowToKanban(status) }, extras)
          invalidateLiveCrm()
        })
        .catch((error: Error) => {
          updateLead(leadId, (l) => ({
            ...l,
            status: prevStatus,
            kanbanColumn: workflowToKanban(prevStatus),
          }))
          sonnerToast.error('Failed to update lead status in Dataverse', { description: error.message })
        })

      appendTimeline(leadId, {
        type: 'status_changed',
        title: 'Status Changed',
        description: `Status updated from ${formatWorkflowStatus(prevStatus)} to ${formatWorkflowStatus(status)}.`,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
        metadata: { from: prevStatus, to: status },
      })

      pushUndo(`Status updated to ${formatWorkflowStatus(status)}`, () => {
        updateLead(leadId, (l) => ({
          ...l,
          status: prevStatus,
          kanbanColumn: workflowToKanban(prevStatus),
        }))
      })
    },
    [leads, leadExtras, updateLead, appendTimeline, pushUndo, syncLeadToQueryCache, invalidateLiveCrm],
  )

  const assignOwner = useCallback(
    (leadId: string, owner: string) => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead || lead.owner === owner) return

      const prevOwner = lead.owner
      const today = new Date().toISOString().slice(0, 10)
      updateLead(leadId, (l) => ({ ...l, owner, lastActivity: today }))

      void LeadApi.assignLeadOwner(leadId, owner)
        .then((updated) => {
          updateLead(leadId, () => ({ ...updated, lastActivity: today }))
          const extras = leadExtras[leadId]
          if (extras) syncLeadToQueryCache({ ...updated, owner }, extras)
          invalidateLiveCrm()
        })
        .catch((error: Error) => {
          updateLead(leadId, (l) => ({ ...l, owner: prevOwner }))
          sonnerToast.error('Failed to assign owner in Dataverse', { description: error.message })
        })

      appendTimeline(leadId, {
        type: 'owner_changed',
        title: 'Owner Changed',
        description: `Lead reassigned from ${prevOwner} to ${owner}.`,
        timestamp: new Date().toISOString(),
        actor: prevOwner,
        metadata: { from: prevOwner, to: owner },
      })

      pushUndo(`Owner assigned to ${owner}`, () => {
        updateLead(leadId, (l) => ({ ...l, owner: prevOwner }))
      })
    },
    [leads, leadExtras, updateLead, appendTimeline, pushUndo, syncLeadToQueryCache, invalidateLiveCrm],
  )

  const openConvertWizard = useCallback((leadId: string) => {
    setConvertLeadId(leadId)
    setConvertWizardOpen(true)
  }, [])

  // Allow the AI Assistant to reuse the same Convert button/wizard as the
  // manual CRM flow. No conversion is performed by the chat action itself.
  useEffect(() => {
    const openFromAssistant = (event: Event) => {
      const leadId = (event as CustomEvent<{ leadId?: string }>).detail?.leadId
      if (!leadId) return
      sessionStorage.removeItem('crm:pending-convert-lead')
      openConvertWizard(leadId)
    }

    const pendingLeadId = sessionStorage.getItem('crm:pending-convert-lead')
    if (pendingLeadId) {
      sessionStorage.removeItem('crm:pending-convert-lead')
      openConvertWizard(pendingLeadId)
    }

    window.addEventListener('crm:open-convert-lead', openFromAssistant)
    return () => window.removeEventListener('crm:open-convert-lead', openFromAssistant)
  }, [openConvertWizard])

  const closeConvertWizard = useCallback(() => {
    setConvertWizardOpen(false)
    setConvertLeadId(null)
  }, [])

  const syncConvertedLead = useCallback(
    (result: ConvertLeadResultDto) => {
      saveStoredConversion(result.lead, {
        opportunityId: result.lead.convertedOpportunityId ?? result.opportunity.id,
        convertedDate: result.lead.convertedDate ?? new Date().toISOString().slice(0, 10),
        convertedBy: result.lead.convertedBy ?? 'System',
        opportunityName: result.lead.opportunityName ?? result.opportunity.name,
      })
      setLeads((prev) => prev.map((l) => (l.id === result.lead.id ? result.lead : l)))
      setLeadExtras((prev) => ({ ...prev, [result.lead.id]: result.extras }))
      queryClient.setQueryData(queryKeys.leads.detail(result.lead.id), {
        lead: result.lead,
        extras: result.extras,
      })
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        updateLeadInListCache(current, result.lead, result.extras),
      )
      // Keep the converted state in the local/query cache. The Dataverse source
      // lead can remain qualified briefly, so invalidating it immediately would
      // make the UI revert to the previous status.
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
      setConvertWizardOpen(false)
      setConvertLeadId(null)
    },
    [queryClient],
  )

  const addNote = useCallback(
    (leadId: string, content: string) => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead || !content.trim()) return

      const note = { id: nextId('note'), content: content.trim(), author: lead.owner, createdAt: new Date().toISOString() }
      setLeadExtras((prev) => ({
        ...prev,
        [leadId]: { ...prev[leadId], notes: [note, ...(prev[leadId]?.notes ?? [])] },
      }))

      appendTimeline(leadId, {
        type: 'note_added',
        title: 'Note Added',
        description: content.trim().slice(0, 120),
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      updateLead(leadId, (l) => ({ ...l, lastActivity: new Date().toISOString().slice(0, 10) }))
      sonnerToast.success('Note added')
    },
    [leads, appendTimeline, updateLead],
  )

  const logCall = useCallback(
    (leadId: string) => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const today = new Date().toISOString().slice(0, 10)
      appendActivity(leadId, {
        type: 'call',
        subject: `Call with ${lead.name}`,
        description: 'Outbound call logged',
        status: 'completed',
        owner: lead.owner,
        createdAt: today,
      })

      appendTimeline(leadId, {
        type: 'call_logged',
        title: 'Call Logged',
        description: `Call completed with ${lead.name} at ${lead.company}.`,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      updateLead(leadId, (l) => ({ ...l, lastActivity: today }))
      if (lead.status === 'assigned') transitionStatus(leadId, 'contacted')
      sonnerToast.success('Call logged')
    },
    [leads, appendActivity, appendTimeline, updateLead, transitionStatus],
  )

  const sendEmail = useCallback(
    (leadId: string, subject = 'Follow-up') => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const today = new Date().toISOString().slice(0, 10)
      const email = {
        id: nextId('email'),
        subject,
        preview: `Email sent to ${lead.email} regarding ${lead.company}.`,
        direction: 'outbound' as const,
        sentAt: today,
        status: 'sent' as const,
      }

      setLeadExtras((prev) => ({
        ...prev,
        [leadId]: { ...prev[leadId], emails: [email, ...(prev[leadId]?.emails ?? [])] },
      }))

      appendActivity(leadId, {
        type: 'email',
        subject,
        status: 'completed',
        owner: lead.owner,
        createdAt: today,
      })

      appendTimeline(leadId, {
        type: 'email_sent',
        title: 'Email Sent',
        description: `"${subject}" sent to ${lead.email}.`,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      updateLead(leadId, (l) => ({ ...l, lastActivity: today }))
      sonnerToast.success('Email sent')
    },
    [leads, appendActivity, appendTimeline, updateLead],
  )

  const scheduleMeeting = useCallback(
    (leadId: string, title = 'Discovery Call') => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const scheduledAt = `${lead.nextFollowUp !== '—' ? lead.nextFollowUp : new Date().toISOString().slice(0, 10)}T10:00:00`
      const meeting = {
        id: nextId('mtg'),
        title,
        scheduledAt,
        duration: '45 min',
        status: 'scheduled' as const,
        attendees: lead.name,
      }

      setLeadExtras((prev) => ({
        ...prev,
        [leadId]: { ...prev[leadId], meetings: [meeting, ...(prev[leadId]?.meetings ?? [])] },
      }))

      appendActivity(leadId, {
        type: 'meeting',
        subject: title,
        dueDate: scheduledAt.slice(0, 10),
        status: 'planned',
        owner: lead.owner,
        createdAt: new Date().toISOString().slice(0, 10),
      })

      appendTimeline(leadId, {
        type: 'meeting_scheduled',
        title: 'Meeting Scheduled',
        description: `${title} with ${lead.name} on ${scheduledAt.slice(0, 10)}.`,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      updateLead(leadId, (l) => ({ ...l, lastActivity: new Date().toISOString().slice(0, 10) }))
      sonnerToast.success('Meeting scheduled')
    },
    [leads, appendActivity, appendTimeline, updateLead],
  )

  const createTask = useCallback(
    (leadId: string, subject = 'Follow-up task') => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      appendActivity(leadId, {
        type: 'task',
        subject,
        dueDate: lead.nextFollowUp !== '—' ? lead.nextFollowUp : undefined,
        status: 'planned',
        owner: lead.owner,
        createdAt: new Date().toISOString().slice(0, 10),
      })

      appendTimeline(leadId, {
        type: 'task_created',
        title: 'Task Created',
        description: subject,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      sonnerToast.success('Task created')
    },
    [leads, appendActivity, appendTimeline],
  )

  const sendProposal = useCallback(
    (leadId: string, title = 'Enterprise Proposal') => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const today = new Date().toISOString().slice(0, 10)
      const attachment = {
        id: nextId('att'),
        name: `${title}.pdf`,
        size: '3.2 MB',
        uploadedBy: lead.owner,
        uploadedAt: today,
        type: 'pdf' as const,
      }

      setLeadExtras((prev) => ({
        ...prev,
        [leadId]: {
          ...prev[leadId],
          attachments: [attachment, ...(prev[leadId]?.attachments ?? [])],
        },
      }))

      appendTimeline(leadId, {
        type: 'proposal_sent',
        title: 'Proposal Sent',
        description: `"${title}" sent to ${lead.email}.`,
        timestamp: new Date().toISOString(),
        actor: lead.owner,
      })

      updateLead(leadId, (l) => ({ ...l, lastActivity: today }))
      if (lead.status === 'qualified') transitionStatus(leadId, 'proposal_sent')
      sonnerToast.success('Proposal sent')
    },
    [leads, appendTimeline, updateLead, transitionStatus],
  )

  const bulkDelete = useCallback(() => {
    const ids = [...selectedIds]
    if (!ids.length) return

    showConfirm({
      title: `Delete ${ids.length} lead${ids.length > 1 ? 's' : ''}?`,
      description: 'This permanently deletes the selected leads from Microsoft Dataverse.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => {
        void Promise.allSettled(
          ids.map((id) => LeadApi.deleteLead(id)),
        ).then((results) => {
          const deletedIds = ids.filter(
            (_id, index) => results[index]?.status === 'fulfilled',
          )
          const failedCount = ids.length - deletedIds.length

          if (deletedIds.length) {
            setLeads((prev) =>
              prev.filter((l) => !deletedIds.includes(l.id)),
            )
            setLeadExtras((prev) => {
              const next = { ...prev }
              deletedIds.forEach((id) => delete next[id])
              return next
            })
            clearSelection()
            void queryClient.invalidateQueries({
              queryKey: queryKeys.crm.all,
            })
            void queryClient.invalidateQueries({
              queryKey: queryKeys.leads.all,
            })
            sonnerToast.success(
              `${deletedIds.length} lead${deletedIds.length > 1 ? 's' : ''} deleted`,
            )
          }

          if (failedCount) {
            sonnerToast.error(
              `${failedCount} lead${failedCount > 1 ? 's' : ''} could not be deleted`,
              {
                description:
                  'The selected records may be locked or have related CRM dependencies.',
              },
            )
          }
        })
      },
    })
  }, [selectedIds, leads, leadExtras, showConfirm, hideConfirm, clearSelection, queryClient])

  const bulkUpdateStatus = useCallback(
    (status: LeadWorkflowStatus) => {
      const ids = [...selectedIds]
      if (!ids.length) return

      const snapshots = leads.filter((l) => ids.includes(l.id)).map((l) => ({ id: l.id, status: l.status }))

      setLeads((prev) =>
        prev.map((l) =>
          ids.includes(l.id) ? { ...l, status, kanbanColumn: workflowToKanban(status), lastActivity: new Date().toISOString().slice(0, 10) } : l,
        ),
      )

      ids.forEach((id) => {
        appendTimeline(id, {
          type: 'status_changed',
          title: 'Status Changed',
          description: `Bulk update to ${formatWorkflowStatus(status)}.`,
          timestamp: new Date().toISOString(),
          actor: 'System',
          metadata: { to: status },
        })
      })

      clearSelection()
      sonnerToast.success(`${ids.length} leads updated to ${formatWorkflowStatus(status)}`)

      void Promise.allSettled(
        ids.map((id) => LeadApi.updateLeadStatus(id, status)),
      ).then((results) => {
        const failed = results.filter((r) => r.status === 'rejected').length
        if (failed > 0) {
          sonnerToast.error(`${failed} lead(s) failed to persist to Dataverse`)
        } else {
          invalidateLiveCrm()
        }
      })

      pushUndo('Bulk status update reverted', () => {
        setLeads((prev) =>
          prev.map((l) => {
            const snap = snapshots.find((s) => s.id === l.id)
            if (!snap) return l
            return { ...l, status: snap.status, kanbanColumn: workflowToKanban(snap.status) }
          }),
        )
      })
    },
    [selectedIds, leads, appendTimeline, clearSelection, pushUndo, invalidateLiveCrm],
  )

  const bulkAssignOwner = useCallback(
    (owner: string) => {
      const ids = [...selectedIds]
      if (!ids.length) return

      const snapshots = leads.filter((l) => ids.includes(l.id)).map((l) => ({ id: l.id, owner: l.owner }))

      setLeads((prev) =>
        prev.map((l) => (ids.includes(l.id) ? { ...l, owner, lastActivity: new Date().toISOString().slice(0, 10) } : l)),
      )

      ids.forEach((id) => {
        appendTimeline(id, {
          type: 'owner_changed',
          title: 'Owner Changed',
          description: `Bulk assignment to ${owner}.`,
          timestamp: new Date().toISOString(),
          actor: 'System',
          metadata: { to: owner },
        })
      })

      clearSelection()
      sonnerToast.success(`${ids.length} leads assigned to ${owner}`)

      void Promise.allSettled(
        ids.map((id) => LeadApi.assignLeadOwner(id, owner)),
      ).then((results) => {
        const failed = results.filter((r) => r.status === 'rejected').length
        if (failed > 0) {
          sonnerToast.error(`${failed} lead(s) failed to persist owner to Dataverse`)
        } else {
          invalidateLiveCrm()
        }
      })

      pushUndo('Bulk owner assignment reverted', () => {
        setLeads((prev) =>
          prev.map((l) => {
            const snap = snapshots.find((s) => s.id === l.id)
            if (!snap) return l
            return { ...l, owner: snap.owner }
          }),
        )
      })
    },
    [selectedIds, leads, appendTimeline, clearSelection, pushUndo, invalidateLiveCrm],
  )

  const bulkExport = useCallback(() => {
    const exportLeads = leads.filter((l) => selectedIds.has(l.id))
    const rows = (exportLeads.length ? exportLeads : filteredLeads).map((l) =>
      [l.name, l.company, l.status, l.owner, l.score, l.expectedRevenue ?? ''].join(','),
    )
    const csv = ['Name,Company,Status,Owner,Score,Expected Revenue', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    sonnerToast.success(`Exported ${rows.length} leads`)
  }, [leads, selectedIds, filteredLeads])

  const syncQualifiedLead = useCallback(
    (result: QualifyLeadResultDto) => {
      setLeads((prev) => prev.map((l) => (l.id === result.lead.id ? result.lead : l)))
      setLeadExtras((prev) => ({ ...prev, [result.lead.id]: result.extras }))
      queryClient.setQueryData(queryKeys.leads.detail(result.lead.id), {
        lead: result.lead,
        extras: result.extras,
      })
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        updateLeadInListCache(current, result.lead, result.extras),
      )
      invalidateLiveCrm()
      setQualifyWizardOpen(false)
      setQualifyLeadId(null)
    },
    [invalidateLiveCrm, queryClient],
  )

  const openQualifyWizard = useCallback((leadId: string) => {
    setQualifyLeadId(leadId)
    setQualifyWizardOpen(true)
  }, [])

  const closeQualifyWizard = useCallback(() => {
    setQualifyWizardOpen(false)
    setQualifyLeadId(null)
  }, [])

  const syncDisqualifiedLead = useCallback(
    (result: DisqualifyLeadResultDto) => {
      setLeads((prev) => prev.map((l) => (l.id === result.lead.id ? result.lead : l)))
      setLeadExtras((prev) => ({ ...prev, [result.lead.id]: result.extras }))
      queryClient.setQueryData(queryKeys.leads.detail(result.lead.id), {
        lead: result.lead,
        extras: result.extras,
      })
      queryClient.setQueryData(queryKeys.leads.list(), (current: LeadsListCache | undefined) =>
        updateLeadInListCache(current, result.lead, result.extras),
      )
      invalidateLiveCrm()
      setDisqualifyWizardOpen(false)
      setDisqualifyLeadId(null)
    },
    [invalidateLiveCrm, queryClient],
  )

  const openDisqualifyWizard = useCallback((leadId: string) => {
    setDisqualifyLeadId(leadId)
    setDisqualifyWizardOpen(true)
  }, [])

  const closeDisqualifyWizard = useCallback(() => {
    setDisqualifyWizardOpen(false)
    setDisqualifyLeadId(null)
  }, [])

  const addLead = useCallback(
    async (data: CreateLeadInput, owner: string): Promise<Lead> => {
      const result = await leadService.createLead(data, owner)
      syncCreatedLead(result)
      return result.lead
    },
    [syncCreatedLead],
  )

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadFromRepository()
      invalidateLiveCrm()
    } finally {
      setIsRefreshing(false)
    }
  }, [loadFromRepository, invalidateLiveCrm])

  // Records changed from the AI Sales Assistant (qualify / convert /
  // disqualify in chat) — reload so the open lead reflects the new status.
  useEffect(() => {
    const onAssistantChange = () => { void refresh() }
    window.addEventListener('crm:assistant-data-changed', onAssistantChange)
    return () => window.removeEventListener('crm:assistant-data-changed', onAssistantChange)
  }, [refresh])


  const value = useMemo<LeadManagementContextValue>(
    () => ({
      leads,
      leadExtras,
      filteredLeads,
      paginatedLeads,
      viewMode,
      searchQuery,
      filters,
      groupBy,
      sortColumn,
      sortDirection,
      visibleColumns,
      columnWidths,
      selectedIds,
      page,
      pageSize,
      totalPages,
      selectedLead: resolvedSelectedLead,
      selectedLeadExtras,
      drawerOpen,
      wizardOpen,
      draftToEdit,
      qualifyWizardOpen,
      qualifyLeadId,
      disqualifyWizardOpen,
      disqualifyLeadId,
      convertWizardOpen,
      convertLeadId,
      filtersOpen,
      activeSavedView,
      showDrafts,
      confirmDialog,
      setViewMode,
      setSearchQuery,
      setFilters,
      setGroupBy,
      setSort,
      toggleSort,
      setVisibleColumns,
      setColumnWidth,
      toggleSelect,
      selectAll,
      clearSelection,
      setPage,
      setPageSize,
      openLead,
      closeDrawer,
      openWizard: (draft?: LeadDraft) => {
        setDraftToEdit(draft ?? null)
        setWizardOpen(true)
      },
      closeWizard: () => {
        setWizardOpen(false)
        setDraftToEdit(null)
      },
      openQualifyWizard,
      closeQualifyWizard,
      openDisqualifyWizard,
      closeDisqualifyWizard,
      openConvertWizard,
      closeConvertWizard,
      setFiltersOpen,
      setShowDrafts,
      applySavedView,
      showConfirm,
      hideConfirm,
      transitionStatus,
      assignOwner,
      addNote,
      logCall,
      sendEmail,
      scheduleMeeting,
      createTask,
      sendProposal,
      bulkDelete,
      bulkUpdateStatus,
      bulkAssignOwner,
      bulkExport,
      addLead,
      syncCreatedLead,
      syncQualifiedLead,
      syncDisqualifiedLead,
      syncConvertedLead,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
      filterOptions: {
        owners: filterOptionsQuery.data?.owners ?? [],
        industries: filterOptionsQuery.data?.industries ?? [],
        sources: filterOptionsQuery.data?.sources ?? [],
        countries: filterOptionsQuery.data?.countries ?? [],
      },
    }),
    [
      leads,
      leadExtras,
      filteredLeads,
      paginatedLeads,
      viewMode,
      searchQuery,
      filters,
      groupBy,
      sortColumn,
      sortDirection,
      visibleColumns,
      columnWidths,
      selectedIds,
      page,
      pageSize,
      totalPages,
      resolvedSelectedLead,
      selectedLead,
      selectedLeadExtras,
      drawerOpen,
      wizardOpen,
      draftToEdit,
      qualifyWizardOpen,
      qualifyLeadId,
      disqualifyWizardOpen,
      disqualifyLeadId,
      convertWizardOpen,
      convertLeadId,
      filtersOpen,
      activeSavedView,
      showDrafts,
      confirmDialog,
      setViewMode,
      setVisibleColumns,
      setColumnWidth,
      toggleSelect,
      selectAll,
      clearSelection,
      toggleSort,
      setSort,
      openLead,
      closeDrawer,
      applySavedView,
      showConfirm,
      hideConfirm,
      transitionStatus,
      assignOwner,
      addNote,
      logCall,
      sendEmail,
      scheduleMeeting,
      createTask,
      sendProposal,
      bulkDelete,
      bulkUpdateStatus,
      bulkAssignOwner,
      bulkExport,
      addLead,
      syncCreatedLead,
      syncQualifiedLead,
      syncDisqualifiedLead,
      syncConvertedLead,
      openQualifyWizard,
      closeQualifyWizard,
      openDisqualifyWizard,
      closeDisqualifyWizard,
      openConvertWizard,
      closeConvertWizard,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
      filterOptionsQuery.data,
    ],
  )

  return (
    <LeadManagementContext.Provider value={value}>{children}</LeadManagementContext.Provider>
  )
}

export function useLeadManagement() {
  const ctx = useContext(LeadManagementContext)
  if (!ctx) throw new Error('useLeadManagement must be used within LeadManagementProvider')
  return ctx
}

export { SAVED_VIEWS }
