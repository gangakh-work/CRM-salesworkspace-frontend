import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'
import { STORAGE_KEYS } from '@/config/constants'
import { useUser } from '@/features/auth/hooks/useUser'
import {
  SAVED_VIEWS,
  computeForecastMetrics,
} from '@/features/opportunity-management/config/saved-views.config'
import { useCrmFilterOptions } from '@/features/crm-workspace/hooks/useCrmFilterOptions'
import { OpportunityApi } from '@/features/opportunity-management/api/OpportunityApi'
import { useOpportunitiesQuery, syncOpportunityDetailCache, mergeOpportunitiesWithServer } from '@/features/opportunity-management/hooks/useOpportunityQueries'
import {
  OpportunityStageError,
  opportunityStageService,
} from '@/features/opportunity-management/services/opportunity-stage.service'
import { subscribeOpportunityUpdated, notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import { isOpportunityAdmin } from '@/features/opportunity-management/lib/auth-roles'
import {
  formatStage,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { semanticMatches } from '@/lib/semantic-search'
import type {
  ConfirmDialogState,
  ForecastMetrics,
  Opportunity,
  OpportunityExtras,
  OpportunityProposal,
  OpportunityFilters,
  OpportunityGroupBy,
  OpportunityStage,
  OpportunityViewMode,
  SavedOpportunityView,
} from '@/features/opportunity-management/types/opportunity.types'
import type { CloseOpportunityWonResultDto } from '@/features/opportunity-management/domain/win.dto'
import type { CloseOpportunityLostResultDto } from '@/features/opportunity-management/domain/lost.dto'
import {
  DEFAULT_OPPORTUNITY_FILTERS,
  OPPORTUNITY_COLUMNS,
} from '@/features/opportunity-management/types/opportunity.types'

export { SAVED_VIEWS }

let eventCounter = 0

function nextId(prefix: string) {
  eventCounter += 1
  return `${prefix}-${Date.now()}-${eventCounter}`
}

const PROPOSAL_STORAGE_KEY = 'sales-workspace:opportunity-proposals'

function loadStoredProposals(): Record<string, OpportunityProposal[]> {
  try {
    const raw = localStorage.getItem(PROPOSAL_STORAGE_KEY)

    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<
      string,
      OpportunityProposal[]
    >

    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveStoredProposals(
  opportunityId: string,
  proposals: OpportunityProposal[],
) {
  try {
    const stored = loadStoredProposals()

    stored[opportunityId] = proposals

    localStorage.setItem(
      PROPOSAL_STORAGE_KEY,
      JSON.stringify(stored),
    )
  } catch {
    /* ignore storage failures */
  }
}

const PROPOSAL_CONTENT_STORAGE_KEY =
  'sales-workspace:opportunity-proposal-content'

function saveStoredProposalContent(
  proposalId: string,
  content: string,
) {
  try {
    const raw = localStorage.getItem(
      PROPOSAL_CONTENT_STORAGE_KEY,
    )

    const stored = raw
      ? (JSON.parse(raw) as Record<string, string>)
      : {}

    stored[proposalId] = content

    localStorage.setItem(
      PROPOSAL_CONTENT_STORAGE_KEY,
      JSON.stringify(stored),
    )
  } catch {
    /* ignore storage failures */
  }
}

function mergeProposalState(
  serverExtras: Record<string, OpportunityExtras>,
  localExtras: Record<string, OpportunityExtras>,
): Record<string, OpportunityExtras> {
  const stored = loadStoredProposals()

  const merged: Record<string, OpportunityExtras> = {
    ...serverExtras,
  }

  for (const [id, extras] of Object.entries(localExtras)) {
    merged[id] = merged[id] ?? extras

    if (extras.proposals?.length) {
      merged[id] = {
        ...merged[id],
        proposals: extras.proposals,
      }
    }
  }

  for (const [id, proposals] of Object.entries(stored)) {
    if (!proposals?.length) continue

    if (!merged[id]) continue

    merged[id] = {
      ...merged[id],
      proposals,
    }
  }

  return merged
}

interface OpportunityManagementContextValue {
  opportunities: Opportunity[]
  opportunityExtras: Record<string, OpportunityExtras>
  filteredOpportunities: Opportunity[]
  paginatedOpportunities: Opportunity[]
  forecastMetrics: ForecastMetrics
  viewMode: OpportunityViewMode
  searchQuery: string
  filters: OpportunityFilters
  groupBy: OpportunityGroupBy
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  visibleColumns: string[]
  columnWidths: Record<string, number>
  selectedIds: Set<string>
  page: number
  pageSize: number
  totalPages: number
  filtersOpen: boolean
  activeSavedView: string
  confirmDialog: ConfirmDialogState | null
  setViewMode: (mode: OpportunityViewMode) => void
  setSearchQuery: (q: string) => void
  setFilters: (f: OpportunityFilters) => void
  setGroupBy: (g: OpportunityGroupBy) => void
  setSort: (
    column: string,
    direction: 'asc' | 'desc',
  ) => void
  toggleSort: (column: string) => void
  setVisibleColumns: (cols: string[]) => void
  setColumnWidth: (col: string, width: number) => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setPage: (p: number) => void
  setPageSize: (size: number) => void
  setFiltersOpen: (open: boolean) => void
  applySavedView: (view: SavedOpportunityView) => void
  showConfirm: (dialog: ConfirmDialogState) => void
  hideConfirm: () => void
  transitionStage: (
    oppId: string,
    stage: OpportunityStage,
  ) => void
  moveToNextStage: (oppId: string) => void
  moveToPreviousStage: (oppId: string) => void
  markOnHold: (oppId: string, onHold: boolean) => void
  assignOwner: (oppId: string, owner: string) => void
  markWon: (oppId: string) => void
  markLost: (oppId: string) => void
  duplicateOpportunity: (oppId: string) => void
  deleteOpportunity: (oppId: string) => void
  bulkDelete: () => void
  generateProposal: (oppId: string) => void
  scheduleMeeting: (
    oppId: string,
    title?: string,
  ) => void
  createTask: (
    oppId: string,
    subject?: string,
  ) => void
  sendEmail: (
    oppId: string,
    subject?: string,
  ) => void
  addNote: (
    oppId: string,
    content: string,
  ) => void
  bulkUpdateStage: (stage: OpportunityStage) => void
  bulkAssignOwner: (owner: string) => void
  bulkExport: () => void
  refresh: () => void
  isRefreshing: boolean
  isLoading: boolean
  loadError: string | null
  filterOptions: {
    owners: string[]
    regions: string[]
    industries: string[]
  }
  winWizardOpen: boolean
  winOpportunityId: string | null
  openWinWizard: (oppId: string) => void
  closeWinWizard: () => void
  syncWonOpportunity: (
    result: CloseOpportunityWonResultDto,
  ) => void
  lostWizardOpen: boolean
  lostOpportunityId: string | null
  openLostWizard: (oppId: string) => void
  closeLostWizard: () => void
  syncLostOpportunity: (
    result: CloseOpportunityLostResultDto,
  ) => void
  createWizardOpen: boolean
  openCreateWizard: () => void
  closeCreateWizard: () => void
}

const OpportunityManagementContext =
  createContext<OpportunityManagementContextValue | null>(null)

function loadViewMode(): OpportunityViewMode {
  try {
    const v = localStorage.getItem(
      STORAGE_KEYS.opportunityViewMode,
    )

    if (v) return v as OpportunityViewMode
  } catch {
    /* ignore */
  }

  return 'table'
}

function loadVisibleColumns(): string[] {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEYS.opportunityColumns,
    )

    if (stored) {
      return JSON.parse(stored) as string[]
    }
  } catch {
    /* ignore */
  }

  return OPPORTUNITY_COLUMNS
    .filter((c) => c.defaultVisible)
    .map((c) => c.id)
}

export function OpportunityManagementProvider({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()

  const { displayName, roles } = useUser()

  const isAdmin = isOpportunityAdmin(roles)

  const opportunitiesQuery = useOpportunitiesQuery()

  const filterOptionsQuery = useCrmFilterOptions()

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([])

  const [opportunityExtras, setOpportunityExtras] =
    useState<Record<string, OpportunityExtras>>({})

  const isLoading = opportunitiesQuery.isLoading

  const loadError = opportunitiesQuery.isError
    ? (opportunitiesQuery.error as Error).message
    : null

  const [viewMode, setViewModeState] =
    useState<OpportunityViewMode>(loadViewMode)

  const [searchQuery, setSearchQuery] = useState('')

  const [filters, setFilters] =
    useState<OpportunityFilters>(
      DEFAULT_OPPORTUNITY_FILTERS,
    )

  const [groupBy, setGroupBy] =
    useState<OpportunityGroupBy>('none')

  const [sortColumn, setSortColumn] =
    useState('expectedRevenue')

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('desc')

  const [visibleColumns, setVisibleColumnsState] =
    useState(loadVisibleColumns)

  const [columnWidths, setColumnWidths] =
    useState<Record<string, number>>({})

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set())

  const [page, setPage] = useState(1)

  const [pageSize, setPageSize] = useState(10)

  const [filtersOpen, setFiltersOpen] =
    useState(false)

  const [activeSavedView, setActiveSavedView] =
    useState('all')

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogState | null>(null)

  const [winWizardOpen, setWinWizardOpen] =
    useState(false)

  const [createWizardOpen, setCreateWizardOpen] =
    useState(false)

  const [winOpportunityId, setWinOpportunityId] =
    useState<string | null>(null)

  const [lostWizardOpen, setLostWizardOpen] =
    useState(false)

  const [lostOpportunityId, setLostOpportunityId] =
    useState<string | null>(null)

  const showConfirm = useCallback(
    (dialog: ConfirmDialogState) =>
      setConfirmDialog(dialog),
    [],
  )

  const hideConfirm = useCallback(
    () => setConfirmDialog(null),
    [],
  )

  const loadFromRepository = useCallback(
    async () => {
      const result =
        await opportunitiesQuery.refetch()

      const payload = result.data

      if (payload) {
        setOpportunities((prev) =>
          mergeOpportunitiesWithServer(
            prev,
            payload.opportunities,
          ),
        )

        setOpportunityExtras((prev) =>
          mergeProposalState(
            payload.opportunityExtras,
            prev,
          ),
        )
      }

      return (
        payload ?? {
          opportunities: [],
          opportunityExtras: {},
        }
      )
    },
    [opportunitiesQuery],
  )

  useEffect(() => {
    if (opportunitiesQuery.data) {
      setOpportunities((prev) =>
        mergeOpportunitiesWithServer(
          prev,
          opportunitiesQuery.data!.opportunities,
        ),
      )

      setOpportunityExtras((prev) =>
        mergeProposalState(
          opportunitiesQuery.data!.opportunityExtras,
          prev,
        ),
      )
    }
  }, [opportunitiesQuery.data])

  useEffect(() => {
    setIsRefreshing(
      opportunitiesQuery.isFetching &&
        !opportunitiesQuery.isLoading,
    )
  }, [
    opportunitiesQuery.isFetching,
    opportunitiesQuery.isLoading,
  ])

  useEffect(() => {
    return subscribeOpportunityUpdated(() => {
      void loadFromRepository()
    })
  }, [loadFromRepository])

  const appendTimeline = useCallback(
    (
      oppId: string,
      event: {
        type: string
        title: string
        description: string
        actor: string
      },
    ) => {
      const evt = {
        id: nextId('tl'),
        ...event,
        timestamp: new Date().toISOString(),
      }

      setOpportunityExtras((prev) => ({
        ...prev,
        [oppId]: {
          ...prev[oppId],
          timeline: [
            evt,
            ...(prev[oppId]?.timeline ?? []),
          ],
        },
      }))
    },
    [],
  )

  const setViewMode = useCallback(
    (mode: OpportunityViewMode) => {
      setViewModeState(mode)

      try {
        localStorage.setItem(
          STORAGE_KEYS.opportunityViewMode,
          mode,
        )
      } catch {
        /* ignore */
      }
    },
    [],
  )

  const setVisibleColumns = useCallback(
    (cols: string[]) => {
      setVisibleColumnsState(cols)

      try {
        localStorage.setItem(
          STORAGE_KEYS.opportunityColumns,
          JSON.stringify(cols),
        )
      } catch {
        /* ignore */
      }
    },
    [],
  )

  const setColumnWidth = useCallback(
    (col: string, width: number) => {
      setColumnWidths((prev) => ({
        ...prev,
        [col]: width,
      }))
    },
    [],
  )

  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities]

    if (searchQuery.trim()) {
      result = result.filter((o) =>
        semanticMatches(searchQuery, [
          o.name,
          o.id,
          o.customer,
          o.primaryContact,
          o.owner,
          o.region,
          o.industry,
          o.description,
        ]),
      )
    }

    if (filters.stage.length) {
      result = result.filter((o) =>
        filters.stage.includes(o.stage),
      )
    }

    if (filters.priority.length) {
      result = result.filter((o) =>
        filters.priority.includes(o.priority),
      )
    }

    if (filters.region.length) {
      result = result.filter((o) =>
        filters.region.includes(o.region),
      )
    }

    if (filters.industry.length) {
      result = result.filter((o) =>
        filters.industry.includes(o.industry),
      )
    }

    if (filters.owner.length) {
      result = result.filter((o) =>
        filters.owner.includes(o.owner),
      )
    }

    if (filters.forecastCategory.length) {
      result = result.filter((o) =>
        filters.forecastCategory.includes(
          o.forecastCategory,
        ),
      )
    }

    if (filters.risk.length) {
      result = result.filter((o) =>
        filters.risk.includes(o.risk),
      )
    }

    if (filters.status.length) {
      result = result.filter((o) =>
        filters.status.includes(o.status),
      )
    }

    result.sort((a, b) => {
      const aVal =
        a[sortColumn as keyof Opportunity]

      const bVal =
        b[sortColumn as keyof Opportunity]

      if (
        aVal === undefined ||
        bVal === undefined
      ) {
        return 0
      }

      if (aVal < bVal) {
        return sortDirection === 'asc' ? -1 : 1
      }

      if (aVal > bVal) {
        return sortDirection === 'asc' ? 1 : -1
      }

      return 0
    })

    return result
  }, [
    opportunities,
    searchQuery,
    filters,
    sortColumn,
    sortDirection,
  ])

  const forecastMetrics = useMemo(
    () =>
      computeForecastMetrics(
        filteredOpportunities,
      ),
    [filteredOpportunities],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOpportunities.length / pageSize,
    ),
  )

  const effectivePage = Math.min(
    page,
    totalPages,
  )

  const paginatedOpportunities = useMemo(() => {
    if (viewMode !== 'table') {
      return filteredOpportunities
    }

    const start =
      (effectivePage - 1) * pageSize

    return filteredOpportunities.slice(
      start,
      start + pageSize,
    )
  }, [
    filteredOpportunities,
    effectivePage,
    pageSize,
    viewMode,
  ])

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)

        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }

        return next
      })
    },
    [],
  )

  const selectAll = useCallback(
    (ids: string[]) =>
      setSelectedIds(new Set(ids)),
    [],
  )

  const clearSelection = useCallback(
    () => setSelectedIds(new Set()),
    [],
  )

  const toggleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((d) =>
          d === 'asc' ? 'desc' : 'asc',
        )
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    },
    [sortColumn],
  )

  const setSort = useCallback(
    (
      column: string,
      direction: 'asc' | 'desc',
    ) => {
      setSortColumn(column)
      setSortDirection(direction)
    },
    [],
  )

  const applySavedView = useCallback(
    (view: SavedOpportunityView) => {
      setFilters(view.filters)
      setGroupBy(view.groupBy)
      setSortColumn(view.sortColumn)
      setSortDirection(view.sortDirection)
      setActiveSavedView(view.id)
      setPage(1)
    },
    [],
  )

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    })

    queryClient.invalidateQueries({
      queryKey: queryKeys.opportunities.all,
    })

    notifyOpportunityUpdated()
  }, [queryClient])

  const handleStageError = useCallback(
    (error: unknown) => {
      sonnerToast.error(
        error instanceof OpportunityStageError
          ? error.message
          : 'Opportunity update failed',
      )
    },
    [],
  )

  const transitionStage = useCallback(
    (
      oppId: string,
      stage: OpportunityStage,
    ) => {
      void opportunityStageService
        .transitionStage({
          opportunityId: oppId,
          targetStage: stage,
          transitionedBy: displayName,
          isAdmin,
        })
        .then(() => {
          invalidateQueries()

          sonnerToast.success(
            `Stage updated to ${formatStage(stage)}`,
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      isAdmin,
      invalidateQueries,
      handleStageError,
    ],
  )

  const moveToNextStage = useCallback(
    (oppId: string) => {
      void opportunityStageService
        .moveToNextStage(
          oppId,
          displayName,
          isAdmin,
        )
        .then(() => {
          invalidateQueries()

          sonnerToast.success(
            'Moved to next stage',
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      isAdmin,
      invalidateQueries,
      handleStageError,
    ],
  )

  const moveToPreviousStage = useCallback(
    (oppId: string) => {
      void opportunityStageService
        .moveToPreviousStage(
          oppId,
          displayName,
          isAdmin,
        )
        .then(() => {
          invalidateQueries()

          sonnerToast.success(
            'Moved to previous stage',
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      isAdmin,
      invalidateQueries,
      handleStageError,
    ],
  )

  const markOnHold = useCallback(
    (
      oppId: string,
      onHold: boolean,
    ) => {
      void opportunityStageService
        .setOnHold({
          opportunityId: oppId,
          onHold,
          updatedBy: displayName,
          isAdmin,
        })
        .then((result) => {
          setOpportunities((prev) =>
            prev.map((o) =>
              o.id === result.opportunity.id
                ? result.opportunity
                : o,
            ),
          )

          setOpportunityExtras((prev) => ({
            ...prev,
            [oppId]: result.extras,
          }))

          syncOpportunityDetailCache(
            queryClient,
            result.opportunity,
            result.extras,
          )

          invalidateQueries()

          sonnerToast.success(
            onHold
              ? 'Opportunity marked on hold'
              : 'Opportunity resumed',
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      isAdmin,
      queryClient,
      invalidateQueries,
      handleStageError,
    ],
  )

  const assignOwner = useCallback(
    (
      oppId: string,
      owner: string,
    ) => {
      void opportunityStageService
        .assignOwner({
          opportunityId: oppId,
          owner,
          assignedBy: displayName,
          isAdmin,
        })
        .then((result) => {
          setOpportunities((prev) =>
            prev.map((o) =>
              o.id === result.opportunity.id
                ? result.opportunity
                : o,
            ),
          )

          setOpportunityExtras((prev) => ({
            ...prev,
            [oppId]: result.extras,
          }))

          syncOpportunityDetailCache(
            queryClient,
            result.opportunity,
            result.extras,
          )

          invalidateQueries()

          sonnerToast.success(
            `Assigned to ${owner}`,
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      isAdmin,
      queryClient,
      invalidateQueries,
      handleStageError,
    ],
  )

  const markWon = useCallback(
    (oppId: string) => {
      setWinOpportunityId(oppId)
      setWinWizardOpen(true)
    },
    [],
  )

  const openWinWizard = useCallback(
    (oppId: string) => {
      setWinOpportunityId(oppId)
      setWinWizardOpen(true)
    },
    [],
  )

  const closeWinWizard = useCallback(() => {
    setWinWizardOpen(false)
    setWinOpportunityId(null)
  }, [])

  const syncWonOpportunity = useCallback(
    (result: CloseOpportunityWonResultDto) => {
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === result.opportunity.id
            ? result.opportunity
            : o,
        ),
      )

      setOpportunityExtras((prev) => ({
        ...prev,
        [result.opportunity.id]:
          result.extras,
      }))

      invalidateQueries()

      closeWinWizard()
    },
    [invalidateQueries, closeWinWizard],
  )

  const markLost = useCallback(
    (oppId: string) => {
      setLostOpportunityId(oppId)
      setLostWizardOpen(true)
    },
    [],
  )

  const openLostWizard = useCallback(
    (oppId: string) => {
      setLostOpportunityId(oppId)
      setLostWizardOpen(true)
    },
    [],
  )

  const closeLostWizard = useCallback(() => {
    setLostWizardOpen(false)
    setLostOpportunityId(null)
  }, [])

  const openCreateWizard = useCallback(
    () => setCreateWizardOpen(true),
    [],
  )

  const closeCreateWizard = useCallback(
    () => setCreateWizardOpen(false),
    [],
  )

  const syncLostOpportunity = useCallback(
    (result: CloseOpportunityLostResultDto) => {
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === result.opportunity.id
            ? result.opportunity
            : o,
        ),
      )

      setOpportunityExtras((prev) => ({
        ...prev,
        [result.opportunity.id]:
          result.extras,
      }))

      invalidateQueries()

      closeLostWizard()
    },
    [invalidateQueries, closeLostWizard],
  )

  const deleteOpportunity = useCallback(
    (oppId: string) => {
      const opportunity = opportunities.find((o) => o.id === oppId)
      if (!opportunity) return

      showConfirm({
        title: `Delete opportunity “${opportunity.name}”?`,
        description: 'This permanently deletes the opportunity from Microsoft Dataverse. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: () => {
          void OpportunityApi.deleteOpportunity(oppId)
            .then(() => {
              setOpportunities((prev) =>
                prev.filter((o) => o.id !== oppId),
              )
              setOpportunityExtras((prev) => {
                const next = { ...prev }
                delete next[oppId]
                return next
              })
              setSelectedIds((prev) => {
                const next = new Set(prev)
                next.delete(oppId)
                return next
              })
              invalidateQueries()
              sonnerToast.success('Opportunity deleted')
            })
            .catch((error: Error) => {
              sonnerToast.error('Unable to delete opportunity', {
                description: error.message,
              })
            })
        },
      })
    },
    [opportunities, showConfirm, invalidateQueries],
  )

  const bulkDelete = useCallback(() => {
    const ids = [...selectedIds]
    if (!ids.length) return

    showConfirm({
      title: `Delete ${ids.length} opportunit${ids.length > 1 ? 'ies' : 'y'}?`,
      description: 'This permanently deletes the selected opportunities from Microsoft Dataverse. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => {
        void Promise.allSettled(
          ids.map((id) => OpportunityApi.deleteOpportunity(id)),
        ).then((results) => {
          const deletedIds = ids.filter(
            (_id, index) => results[index]?.status === 'fulfilled',
          )
          const failedCount = ids.length - deletedIds.length

          if (deletedIds.length) {
            setOpportunities((prev) =>
              prev.filter((o) => !deletedIds.includes(o.id)),
            )
            setOpportunityExtras((prev) => {
              const next = { ...prev }
              deletedIds.forEach((id) => delete next[id])
              return next
            })
            clearSelection()
            invalidateQueries()
            sonnerToast.success(
              `${deletedIds.length} opportunit${deletedIds.length > 1 ? 'ies' : 'y'} deleted`,
            )
          }

          if (failedCount) {
            sonnerToast.error(
              `${failedCount} opportunit${failedCount > 1 ? 'ies' : 'y'} could not be deleted`,
              {
                description:
                  'The selected records may be locked or have related CRM dependencies.',
              },
            )
          }
        })
      },
    })
  }, [selectedIds, showConfirm, clearSelection, invalidateQueries])

  const duplicateOpportunity = useCallback(
    (oppId: string) => {
      void opportunityStageService
        .duplicateOpportunity(
          oppId,
          displayName,
          isAdmin,
        )
        .then(() => {
          invalidateQueries()

          sonnerToast.success(
            'Opportunity duplicated',
          )
        })
        .catch(handleStageError)
    },
    [
      displayName,
      invalidateQueries,
      handleStageError,
    ],
  )

  const generateProposal = useCallback(
    (oppId: string) => {
      const today = new Date()
        .toISOString()
        .slice(0, 10)

      const currentExtras =
        opportunityExtras[oppId]

      const opportunity = opportunities.find(
        (o) => o.id === oppId,
      )

      if (!currentExtras || !opportunity) {
        sonnerToast.error(
          'Unable to generate proposal',
          {
            description:
              'Opportunity details are still loading. Please try again.',
          },
        )

        return
      }

      const prop: OpportunityProposal = {
        id: nextId('prop'),
        title: 'Generated Proposal',
        version: `v${(
          currentExtras.proposals.length + 1
        ).toFixed(1)}`,
        status: 'draft',
        generatedDate: today,
        value:
          currentExtras.commercials.revenue,
        isCurrent: true,
      }

      const proposals = [
        prop,
        ...currentExtras.proposals.map(
          (p) => ({
            ...p,
            isCurrent: false,
          }),
        ),
      ]

      setOpportunityExtras((prev) => ({
        ...prev,
        [oppId]: {
          ...currentExtras,
          ...(prev[oppId] ?? {}),
          proposals,
        },
      }))

      saveStoredProposals(
        oppId,
        proposals,
      )

      const proposalContent = [
        `# Proposal: ${opportunity.name}`,
        '',
        '## Opportunity',
        '',
        `- Customer: ${opportunity.customer}`,
        `- Owner: ${opportunity.owner}`,
        `- Industry: ${opportunity.industry}`,
        `- Region: ${opportunity.region}`,
        `- Stage: ${opportunity.stage}`,
        `- Priority: ${opportunity.priority}`,
        `- Forecast: ${opportunity.forecastCategory}`,
        `- Close Date: ${opportunity.closeDate}`,
        `- Win Probability: ${opportunity.probability}%`,
        '',
        '## Commercials',
        '',
        `- Revenue: ${currentExtras.commercials.revenue}`,
        `- Cost: ${currentExtras.commercials.cost}`,
        `- Margin: ${currentExtras.commercials.margin}`,
        `- Discount: ${currentExtras.commercials.discount}%`,
        `- Currency: ${currentExtras.commercials.currency}`,
        '',
        '## Proposal',
        '',
        `This proposal was generated for ${opportunity.name}.`,
        '',
        opportunity.description
          ? `### Opportunity Description\n\n${opportunity.description}`
          : '',
        '',
        '## Recommended Next Steps',
        '',
        '- Confirm customer requirements and success criteria.',
        '- Validate the proposed solution with the solution team.',
        '- Confirm commercials and approval requirements.',
        '- Align with customer stakeholders on the proposal.',
        '- Finalize the proposal before customer presentation.',
        '',
        `**Proposal Version:** ${prop.version}`,
        `**Generated Date:** ${prop.generatedDate}`,
      ]
        .filter(Boolean)
        .join('\n')

      saveStoredProposalContent(
        prop.id,
        proposalContent,
      )

      appendTimeline(oppId, {
        type: 'proposal_generated',
        title: 'Proposal Generated',
        description:
          'New proposal version created.',
        actor: 'System',
      })

      sonnerToast.success(
        'Proposal generated',
      )
    },
    [
      appendTimeline,
      opportunityExtras,
      opportunities,
    ],
  )

  const scheduleMeeting = useCallback(
    (
      oppId: string,
      title = 'Executive Review',
    ) => {
      const today = new Date()
        .toISOString()
        .slice(0, 10)

      setOpportunityExtras((prev) => ({
        ...prev,
        [oppId]: {
          ...prev[oppId],
          meetings: [
            {
              id: nextId('mtg'),
              title,
              scheduledAt: `${today}T14:00:00`,
              status: 'scheduled',
            },
            ...(prev[oppId]?.meetings ?? []),
          ],
        },
      }))

      sonnerToast.success(
        'Meeting scheduled',
      )
    },
    [],
  )

  const createTask = useCallback(
    (
      oppId: string,
      subject = 'Follow up on opportunity',
    ) => {
      void OpportunityApi.createActivity(
        oppId,
        { subject },
      )
        .then(() => {
          sonnerToast.success(
            'Task created in Dataverse',
          )

          void queryClient.invalidateQueries({
            queryKey:
              queryKeys.opportunities.detail(
                oppId,
              ),
          })

          void queryClient.invalidateQueries({
            queryKey:
              queryKeys.opportunities.all,
          })

          void loadFromRepository()
        })
        .catch((error: Error) => {
          sonnerToast.error(
            'Failed to create task',
            {
              description: error.message,
            },
          )
        })
    },
    [loadFromRepository, queryClient],
  )

  const sendEmail = useCallback(
    (
      oppId: string,
      subject = 'Follow-up',
    ) => {
      const today = new Date()
        .toISOString()
        .slice(0, 10)

      setOpportunityExtras((prev) => ({
        ...prev,
        [oppId]: {
          ...prev[oppId],
          emails: [
            {
              id: nextId('em'),
              subject,
              preview:
                'Email sent successfully...',
              sentAt: today,
              direction: 'outbound',
            },
            ...(prev[oppId]?.emails ?? []),
          ],
        },
      }))

      sonnerToast.success(
        'Email sent',
      )
    },
    [],
  )

  const addNote = useCallback(
    (
      oppId: string,
      content: string,
    ) => {
      void OpportunityApi.addNote(
        oppId,
        content,
      )
        .then(() => {
          sonnerToast.success(
            'Note added to Dataverse',
          )

          void queryClient.invalidateQueries({
            queryKey:
              queryKeys.opportunities.detail(
                oppId,
              ),
          })

          void queryClient.invalidateQueries({
            queryKey:
              queryKeys.opportunities.all,
          })

          void loadFromRepository()
        })
        .catch((error: Error) => {
          sonnerToast.error(
            'Failed to add note',
            {
              description: error.message,
            },
          )
        })
    },
    [loadFromRepository, queryClient],
  )

  const bulkUpdateStage = useCallback(
    (stage: OpportunityStage) => {
      selectedIds.forEach((id) =>
        transitionStage(id, stage),
      )

      clearSelection()
    },
    [
      selectedIds,
      transitionStage,
      clearSelection,
    ],
  )

  const bulkAssignOwner = useCallback(
    (owner: string) => {
      const ids = [...selectedIds]

      void Promise.all(
        ids.map((id) =>
          opportunityStageService.assignOwner({
            opportunityId: id,
            owner,
            assignedBy: displayName,
            isAdmin,
          }),
        ),
      )
        .then(() => {
          invalidateQueries()

          clearSelection()

          sonnerToast.success(
            `Assigned ${ids.length} opportunities to ${owner}`,
          )
        })
        .catch(handleStageError)
    },
    [
      selectedIds,
      displayName,
      invalidateQueries,
      clearSelection,
      handleStageError,
    ],
  )

  const bulkExport = useCallback(() => {
    sonnerToast.success(
      `Exported ${
        selectedIds.size ||
        filteredOpportunities.length
      } opportunities`,
    )
  }, [
    selectedIds,
    filteredOpportunities,
  ])

  const refresh = useCallback(() => {
    setIsRefreshing(true)

    void loadFromRepository().finally(() =>
      setIsRefreshing(false),
    )
  }, [loadFromRepository])

  const value = useMemo(
    (): OpportunityManagementContextValue => ({
      opportunities,
      opportunityExtras,
      filteredOpportunities,
      paginatedOpportunities,
      forecastMetrics,
      viewMode,
      searchQuery,
      filters,
      groupBy,
      sortColumn,
      sortDirection,
      visibleColumns,
      columnWidths,
      selectedIds,
      page: effectivePage,
      pageSize,
      totalPages,
      filtersOpen,
      activeSavedView,
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
      setFiltersOpen,
      applySavedView,
      showConfirm,
      hideConfirm,
      transitionStage,
      moveToNextStage,
      moveToPreviousStage,
      markOnHold,
      assignOwner,
      markWon,
      markLost,
      duplicateOpportunity,
      deleteOpportunity,
      bulkDelete,
      generateProposal,
      scheduleMeeting,
      createTask,
      sendEmail,
      addNote,
      bulkUpdateStage,
      bulkAssignOwner,
      bulkExport,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
      filterOptions: {
        owners:
          filterOptionsQuery.data?.owners ??
          [],
        regions:
          filterOptionsQuery.data?.regions ??
          [],
        industries:
          filterOptionsQuery.data?.industries ??
          [],
      },
      winWizardOpen,
      winOpportunityId,
      openWinWizard,
      closeWinWizard,
      syncWonOpportunity,
      lostWizardOpen,
      lostOpportunityId,
      openLostWizard,
      closeLostWizard,
      syncLostOpportunity,
      createWizardOpen,
      openCreateWizard,
      closeCreateWizard,
    }),
    [
      opportunities,
      opportunityExtras,
      filteredOpportunities,
      paginatedOpportunities,
      forecastMetrics,
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
      effectivePage,
      pageSize,
      totalPages,
      filtersOpen,
      activeSavedView,
      confirmDialog,
      setViewMode,
      setVisibleColumns,
      setColumnWidth,
      toggleSelect,
      selectAll,
      clearSelection,
      toggleSort,
      setSort,
      applySavedView,
      showConfirm,
      hideConfirm,
      transitionStage,
      moveToNextStage,
      moveToPreviousStage,
      markOnHold,
      assignOwner,
      markWon,
      markLost,
      duplicateOpportunity,
      deleteOpportunity,
      bulkDelete,
      generateProposal,
      scheduleMeeting,
      createTask,
      sendEmail,
      addNote,
      bulkUpdateStage,
      bulkAssignOwner,
      bulkExport,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
      filterOptionsQuery.data,
      winWizardOpen,
      winOpportunityId,
      openWinWizard,
      closeWinWizard,
      syncWonOpportunity,
      lostWizardOpen,
      lostOpportunityId,
      openLostWizard,
      closeLostWizard,
      syncLostOpportunity,
      createWizardOpen,
      openCreateWizard,
      closeCreateWizard,
    ],
  )

  return (
    <OpportunityManagementContext.Provider
      value={value}
    >
      {children}
    </OpportunityManagementContext.Provider>
  )
}

export function useOpportunityManagement() {
  const ctx = useContext(
    OpportunityManagementContext,
  )

  if (!ctx) {
    throw new Error(
      'useOpportunityManagement must be used within OpportunityManagementProvider',
    )
  }

  return ctx
}