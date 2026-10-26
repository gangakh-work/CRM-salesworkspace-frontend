import {
  ChevronDown,
  Columns3,
  Download,
  Filter,
  FilePenLine,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Share2,
  Table2,
  Trash2,
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
import {
  SAVED_VIEWS,
  useLeadManagement,
} from '@/features/lead-management/context/LeadManagementProvider'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import { LEAD_COLUMNS } from '@/features/lead-management/types/lead.types'
import type {
  LeadGroupBy,
  LeadViewMode,
  LeadWorkflowStatus,
} from '@/features/lead-management/types/lead.types'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: {
  id: LeadViewMode
  label: string
  icon: typeof Table2
}[] = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: List },
]

const BULK_STATUSES: LeadWorkflowStatus[] = [
  'draft',
  'assigned',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
]

export function LeadToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    selectedIds,
    filteredLeads,
    visibleColumns,
    setVisibleColumns,
    groupBy,
    setGroupBy,
    activeSavedView,
    applySavedView,
    openWizard,
    bulkDelete,
    bulkUpdateStatus,
    bulkAssignOwner,
    bulkExport,
    refresh,
    isRefreshing,
    setFiltersOpen,
    filtersOpen,
    filterOptions,
    showDrafts,
    setShowDrafts,
  } = useLeadManagement()

  const selectedCount = selectedIds.size

  /**
   * Share the current Lead Management page.
   *
   * Uses the browser's native share dialog when available.
   * Otherwise copies the current URL to the clipboard.
   * Does not modify any lead data or workflow.
   */
  const handleShare = async () => {
    const url = window.location.href

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Sales Workspace - Leads',
          text: 'Lead Management',
          url,
        })
        return
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)

        const { toast } = await import('sonner')

        toast.success('Lead workspace link copied')
        return
      }

      const textArea = document.createElement('textarea')

      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '0'
      textArea.style.opacity = '0'

      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()

      const copied = document.execCommand('copy')

      document.body.removeChild(textArea)

      const { toast } = await import('sonner')

      if (copied) {
        toast.success('Lead workspace link copied')
      } else {
        toast.error('Unable to copy the link', {
          description:
            'Please copy the URL from the browser address bar.',
        })
      }
    } catch (error) {
      /*
       * Canceling the native browser Share dialog
       * is not an application error.
       */
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return
      }

      const { toast } = await import('sonner')

      toast.error('Unable to share lead workspace', {
        description:
          'Please copy the URL from the browser address bar.',
      })
    }
  }

  return (
    <header className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Typography variant="heading-m">
            Lead Management
          </Typography>

          <Typography variant="caption" tone="muted">
            {filteredLeads.length} leads · Full lifecycle workflow
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            placeholder="Search leads..."
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
                  onClick={() => {
                    setShowDrafts(false)
                    applySavedView(view)
                  }}
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
            variant={showDrafts ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowDrafts(!showDrafts)}
          >
            <FilePenLine className="size-4" />
            Drafts
          </Button>

          <Button
            variant={filtersOpen ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="size-4" />
            Filters
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowDrafts(false)
              openWizard()
            }}
          >
            <Plus className="size-4" />
            New Lead
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.open('/templates/Lead_Template.xlsx', '_blank', 'noopener,noreferrer')}><Download className="size-4" /> Lead Template</Button>

          {/* NEW: Share button */}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Share"
            title="Share Lead Management"
            onClick={() => void handleShare()}
          >
            <Share2 className="size-4" />
          </Button>

          {/* Existing Download / Export - unchanged */}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Export"
            title="Download / Export"
            onClick={bulkExport}
          >
            <Download className="size-4" />
          </Button>

          {/* Import / Upload button intentionally removed */}

          {/* Existing Refresh - unchanged */}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Refresh"
            title="Refresh"
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
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
          {VIEW_OPTIONS.map(
            ({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={
                  viewMode === id ? 'primary' : 'ghost'
                }
                size="sm"
                className="h-8 gap-1.5 text-xs"
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
          <Select
            value={groupBy}
            onValueChange={(v) =>
              setGroupBy(v as LeadGroupBy)
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">
                No grouping
              </SelectItem>

              <SelectItem value="status">
                Status
              </SelectItem>

              <SelectItem value="owner">
                Owner
              </SelectItem>

              <SelectItem value="industry">
                Industry
              </SelectItem>

              <SelectItem value="priority">
                Priority
              </SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
              >
                <Columns3 className="size-3.5" />
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

              {LEAD_COLUMNS.filter(
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
                    Update Status
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  {BULK_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() =>
                        bulkUpdateStatus(status)
                      }
                    >
                      {formatWorkflowStatus(status)}
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
        </div>
      </div>
    </header>
  )
}