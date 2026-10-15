import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'

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
import { WorkflowCard } from '@/features/workflow-engine/components/WorkflowCard'
import { WorkflowNotificationsPanel } from '@/features/workflow-engine/components/WorkflowNotifications'
import { WORKFLOW_OWNERS } from '@/features/workflow-engine/data/workflow-helpers'
import {
  useWorkflowEngine,
  WORKFLOW_TEMPLATES,
} from '@/features/workflow-engine/context/WorkflowEngineProvider'
import { useCrmFilterOptions } from '@/features/crm-workspace/hooks/useCrmFilterOptions'
import { useNavigateToWorkflow } from '@/features/workflow-engine/hooks/useNavigateToWorkflow'
import type { WorkflowTemplateId } from '@/features/workflow-engine/types/workflow.types'
import { pageTransition } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

export function WorkflowListPage() {
  const {
    filteredWorkflows,
    stats,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    startWorkflowFromTemplate,
    refresh,
    isRefreshing,
    unreadNotifications,
  } = useWorkflowEngine()
  const navigateToWorkflow = useNavigateToWorkflow()
  const [showNotifications, setShowNotifications] = useState(false)
  const filterOptionsQuery = useCrmFilterOptions()
  const ownerFilterOptions =
    filterOptionsQuery.data?.owners?.length ? filterOptionsQuery.data.owners : WORKFLOW_OWNERS

  const startNew = (templateId: WorkflowTemplateId) => {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    const instance = startWorkflowFromTemplate(templateId, `${template.name} — New`, 'Vinay Kumar')
    navigateToWorkflow(instance)
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="heading-m">Workflow Engine</Typography>
            <Typography variant="caption" tone="muted">
              {stats.active} active · {stats.awaitingApproval} awaiting approval · Enterprise sales workflows
            </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              containerClassName="w-full sm:w-56"
              className="h-9"
            />
            <Button
              variant={showNotifications ? 'primary' : 'outline'}
              size="sm"
              className="gap-1"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="size-4" />
              {unreadNotifications > 0 && <Badge variant="warning" className="ml-1 h-5 px-1.5">{unreadNotifications}</Badge>}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" size="sm" className="gap-1">
                  <Plus className="size-4" />
                  Start Workflow
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                {WORKFLOW_TEMPLATES.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => startNew(t.id)}>
                    <Workflow className="mr-2 size-4" />
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon-sm" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Completed', value: stats.completed },
            { label: 'Avg Progress', value: `${stats.avgProgress}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
              <Typography variant="caption" tone="muted">{label}</Typography>
              <Typography variant="heading-m" className="text-lg">{value}</Typography>
            </div>
          ))}
        </div>
      </header>

      {showNotifications && (
        <div className="shrink-0 border-b border-border/60 bg-muted/20 p-4">
          <WorkflowNotificationsPanel />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div key="list" variants={pageTransition} initial="initial" animate="animate" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="size-3.5" />
                    Status
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(['active', 'paused', 'completed', 'cancelled'] as const).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => {
                        const next = filters.status.includes(s)
                          ? filters.status.filter((x) => x !== s)
                          : [...filters.status, s]
                        setFilters({ ...filters, status: next })
                      }}
                    >
                      {filters.status.includes(s) ? '✓ ' : ''}{s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    Owner
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {ownerFilterOptions.map((o) => (
                    <DropdownMenuItem
                      key={o}
                      onClick={() => {
                        const next = filters.owner.includes(o)
                          ? filters.owner.filter((x) => x !== o)
                          : [...filters.owner, o]
                        setFilters({ ...filters, owner: next })
                      }}
                    >
                      {filters.owner.includes(o) ? '✓ ' : ''}{o}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWorkflows.map((wf) => (
                <WorkflowCard key={wf.id} workflow={wf} onClick={() => navigateToWorkflow(wf)} />
              ))}
            </div>

            {!filteredWorkflows.length && (
              <div className="rounded-xl border border-dashed py-16 text-center">
                <Workflow className="mx-auto size-10 text-muted-foreground/50" />
                <Typography variant="body" className="mt-3 font-medium">No workflows match your criteria</Typography>
                <Typography variant="caption" tone="muted">Start a new workflow from the toolbar above</Typography>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
