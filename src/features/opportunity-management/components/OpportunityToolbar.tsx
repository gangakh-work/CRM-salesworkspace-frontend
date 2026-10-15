import {
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  Columns3,
  Download,
  Trash2,
  Filter,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Table2,
  TrendingUp,
  UserPlus,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchBox } from '@/components/ui/search-box'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import {
  SAVED_VIEWS,
  useOpportunityManagement,
} from '@/features/opportunity-management/context/OpportunityManagementProvider'
import {
  formatStage,
  STAGE_ORDER,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import { OPPORTUNITY_COLUMNS } from '@/features/opportunity-management/types/opportunity.types'
import type {
  OpportunityGroupBy,
  OpportunityViewMode,
} from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: {
  id: OpportunityViewMode
  label: string
  icon: typeof Table2
}[] = [
  {
    id: 'table',
    label: 'Table',
    icon: Table2,
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: Columns3,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: GitBranch,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: List,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarDays,
  },
  {
    id: 'forecast',
    label: 'Forecast',
    icon: BarChart3,
  },
]

export function OpportunityToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    selectedIds,
    filteredOpportunities,
    visibleColumns,
    setVisibleColumns,
    groupBy,
    setGroupBy,
    activeSavedView,
    applySavedView,
    bulkUpdateStage,
    bulkAssignOwner,
    bulkExport,
    bulkDelete,
    refresh,
    isRefreshing,
    setFiltersOpen,
    filtersOpen,
    forecastMetrics,
    filterOptions,
    openCreateWizard,
  } = useOpportunityManagement()

  const selectedCount = selectedIds.size
  const { open: openAssistant } = useAiCopilot()

  return (
    <header className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Typography variant="heading-m">
            Opportunity Management
          </Typography>

          <Typography variant="caption" tone="muted">
            {filteredOpportunities.length} opportunities ·{' '}
            {forecastMetrics.quarterLabel} · Enterprise pipeline
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            containerClassName="w-full sm:w-56"
            className="h-9"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
              >
                Saved Views
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {SAVED_VIEWS.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => applySavedView(view)}
                  className={
                    activeSavedView === view.id
                      ? 'bg-accent'
                      : ''
                  }
                >
                  {view.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={
              filtersOpen ? 'primary' : 'outline'
            }
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="size-4" />
            Filters
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={openCreateWizard}
          >
            <Plus className="size-4" />
            New Opportunity
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/templates/Opportunity_Template.xlsx', '_blank', 'noopener,noreferrer')}
            title="Download Opportunity Excel template"
          >
            <Download className="size-4" />
            Template
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="AI Assistant"
            title="Open AI Assistant"
            onClick={() =>
              openAssistant({ mode: 'docked' })
            }
          >
            <Bot className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Export"
            onClick={bulkExport}
          >
            <Download className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Refresh"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn(
                'size-4',
                isRefreshing && 'animate-spin',
              )}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-0.5">
          {VIEW_OPTIONS.map(
            ({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={
                  viewMode === id ? 'primary' : 'ghost'
                }
                size="sm"
                className="h-8 shrink-0 gap-1.5 text-xs"
                onClick={() => setViewMode(id)}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">
                  {label}
                </span>
              </Button>
            ),
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode !== 'forecast' && (
            <Select
              value={groupBy}
              onValueChange={(v) =>
                setGroupBy(v as OpportunityGroupBy)
              }
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">
                  No grouping
                </SelectItem>
                <SelectItem value="stage">
                  Stage
                </SelectItem>
                <SelectItem value="owner">
                  Owner
                </SelectItem>
                <SelectItem value="region">
                  Region
                </SelectItem>
                <SelectItem value="industry">
                  Industry
                </SelectItem>
                <SelectItem value="priority">
                  Priority
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {viewMode === 'table' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                >
                  <LayoutGrid className="size-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="max-h-80 overflow-y-auto"
              >
                <DropdownMenuLabel>
                  Toggle columns
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {OPPORTUNITY_COLUMNS.filter(
                  (c) => c.id !== 'select',
                ).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={visibleColumns.includes(col.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVisibleColumns([
                          ...visibleColumns,
                          col.id,
                        ])
                      } else {
                        setVisibleColumns(
                          visibleColumns.filter(
                            (id) => id !== col.id,
                          ),
                        )
                      }
                    }}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1">
              <Badge variant="info">
                {selectedCount} selected
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                  >
                    <UserPlus className="size-3.5" />
                    Assign Owner
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  {filterOptions.owners.map((owner) => (
                    <DropdownMenuItem
                      key={owner}
                      onClick={() =>
                        bulkAssignOwner(owner)
                      }
                    >
                      {owner}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Update Stage
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  {STAGE_ORDER.map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={() =>
                        bulkUpdateStage(stage)
                      }
                    >
                      {formatStage(stage)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={bulkExport}
              >
                <Download className="size-3.5" />
                Export
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={bulkDelete}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          )}

          {viewMode === 'forecast' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-primary" />
              Forecast accuracy{' '}
              {forecastMetrics.forecastAccuracy}%
            </div>
          )}
        </div>
      </div>
    </header>
  )
}