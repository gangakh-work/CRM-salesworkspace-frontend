import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueries, useQueryClient } from '@tanstack/react-query'

import { STORAGE_KEYS } from '@/config/constants'
import { WorkspaceApi } from '@/features/crm-workspace/api/WorkspaceApi'
import { getTabFromPath } from '@/features/crm-workspace/lib/workspace-config'
import { useUser } from '@/features/auth/hooks/useUser'
import type {
  ViewMode,
  WorkspaceRecord,
  WorkspaceTabId,
} from '@/features/crm-workspace/types/workspace.types'
import { WORKSPACE_TABS } from '@/features/crm-workspace/types/workspace.types'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { semanticMatches } from '@/lib/semantic-search'

const WORKSPACE_DATA_TABS: WorkspaceTabId[] = [
  'leads',
  'opportunities',
  'activities',
  'customers',
  'documents',
  'tasks',
]

interface WorkspaceContextValue {
  activeTab: WorkspaceTabId
  viewMode: ViewMode
  searchQuery: string
  activeFilter: string
  records: WorkspaceRecord[]
  tabCounts: Partial<Record<WorkspaceTabId, number>>
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: string) => void
  navigateToTab: (tab: WorkspaceTabId) => void
  refresh: () => void
  isRefreshing: boolean
  isLoading: boolean
  loadError: string | null
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function loadViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.workspaceViewMode)
    if (stored) return stored as ViewMode
  } catch {
    /* ignore */
  }
  return 'cards'
}

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { displayName } = useUser()
  const activeTab = getTabFromPath(location.pathname)
  const [viewMode, setViewModeState] = useState<ViewMode>(loadViewMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const tabQueries = useQueries({
    queries: WORKSPACE_DATA_TABS.map((tab) => ({
      queryKey: queryKeys.crm.workspaceTab(tab),
      queryFn: () => WorkspaceApi.fetchTabRecords(tab),
      staleTime: 30_000,
    })),
  })

  const workspaceRecords = useMemo(() => {
    const map: Partial<Record<WorkspaceTabId, WorkspaceRecord[]>> = {}
    WORKSPACE_DATA_TABS.forEach((tab, index) => {
      map[tab] = tabQueries[index]?.data ?? []
    })
    return map
  }, [tabQueries])

  const activeTabIndex = WORKSPACE_DATA_TABS.indexOf(activeTab)
  const activeQuery = activeTabIndex >= 0 ? tabQueries[activeTabIndex] : undefined
  const isLoading = activeQuery?.isLoading ?? false
  const loadError = activeQuery?.isError
    ? activeQuery.error instanceof Error
      ? activeQuery.error.message
      : 'Unable to load workspace data'
    : null
  const isRefreshing = Boolean(activeQuery?.isFetching && !activeQuery.isLoading)

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEYS.workspaceViewMode, mode)
    } catch {
      /* ignore */
    }
  }, [])

  const navigateToTab = useCallback(
    (tab: WorkspaceTabId) => {
      const tabConfig = WORKSPACE_TABS.find((t) => t.id === tab)
      if (tabConfig) navigate(tabConfig.path)
    },
    [navigate],
  )

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
  }, [queryClient])

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<WorkspaceTabId, number>> = {}
    for (const [tab, records] of Object.entries(workspaceRecords)) {
      counts[tab as WorkspaceTabId] = records?.length ?? 0
    }
    return counts
  }, [workspaceRecords])

  const records = useMemo(() => {
    let items = workspaceRecords[activeTab] ?? []
    const today = new Date().toISOString().slice(0, 10)

    if (searchQuery.trim()) {
      items = items.filter((r) =>
        semanticMatches(searchQuery, [
          r.title,
          r.subtitle,
          r.company,
          r.owner,
          r.email,
          r.phone,
          ...(r.tags ?? []),
        ]),
      )
    }

    if (activeFilter === 'mine') {
      items = items.filter((r) => r.owner === displayName)
    } else if (activeFilter === 'high-priority') {
      items = items.filter((r) => r.priority === 'high')
    } else if (activeFilter === 'today') {
      items = items.filter((r) => r.dueDate?.startsWith(today) || r.date === today)
    }

    return items
  }, [activeTab, searchQuery, activeFilter, workspaceRecords, displayName])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      activeTab,
      viewMode,
      searchQuery,
      activeFilter,
      records,
      tabCounts,
      setViewMode,
      setSearchQuery,
      setActiveFilter,
      navigateToTab,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
    }),
    [
      activeTab,
      viewMode,
      searchQuery,
      activeFilter,
      records,
      tabCounts,
      setViewMode,
      navigateToTab,
      refresh,
      isRefreshing,
      isLoading,
      loadError,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
