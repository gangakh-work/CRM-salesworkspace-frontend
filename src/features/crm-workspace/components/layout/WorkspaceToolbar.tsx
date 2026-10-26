import {
  Bot,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchBox } from '@/components/ui/search-box'
import { Typography } from '@/components/ui/typography'
import { ViewModeSwitcher } from '@/features/crm-workspace/components/ViewModeSwitcher'
import { QUICK_ACTIONS } from '@/features/crm-workspace/lib/workspace-config'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { QUICK_FILTERS, WORKSPACE_TABS } from '@/features/crm-workspace/types/workspace.types'
import { NotificationCenter } from '@/shell/NotificationCenter'

import { cn } from '@/lib/utils'

export function WorkspaceToolbar() {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    refresh,
    isRefreshing,
    records,
  } = useWorkspace()

  const tabConfig = WORKSPACE_TABS.find((t) => t.id === activeTab)


  return (
    <header className="shrink-0 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="heading-m">{tabConfig?.label}</Typography>
          <Typography variant="caption" tone="muted">
            {tabConfig?.description} · {records.length} records
          </Typography>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <SearchBox
            placeholder="Global search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            containerClassName="w-full sm:w-56"
            className="h-9 bg-muted/40"
          />

          <div className="hidden items-center gap-1 md:flex">
            {QUICK_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActiveFilter(filter.id)}
              >
                <Filter className="mr-1 size-3" />
                {filter.label}
              </Button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="primary" size="sm" className="gap-1">
                <Plus className="size-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {QUICK_ACTIONS.slice(0, 4).map((action) => (
                <DropdownMenuItem key={action.id}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>



          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Export"
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

          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Import records
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export view
              </DropdownMenuItem>
              <DropdownMenuItem>
                View settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <ViewModeSwitcher />

        <div className="flex items-center gap-2 md:hidden">
          <Filter className="size-4 text-muted-foreground" />

          {QUICK_FILTERS.slice(0, 3).map((filter) => (
            <Badge
              key={filter.id}
              variant={
                activeFilter === filter.id
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer"
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  )
}