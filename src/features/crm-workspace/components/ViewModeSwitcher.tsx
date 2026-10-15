import { motion } from 'framer-motion'
import {
  CalendarDays,
  Columns3,
  GanttChart,
  LayoutGrid,
  List,
  Table2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import type { ViewMode } from '@/features/crm-workspace/types/workspace.types'
import { cn } from '@/lib/utils'

const VIEW_ICONS: Record<ViewMode, typeof LayoutGrid> = {
  cards: LayoutGrid,
  list: List,
  kanban: Columns3,
  table: Table2,
  calendar: CalendarDays,
  timeline: GanttChart,
}

const VIEW_LABELS: Record<ViewMode, string> = {
  cards: 'Cards',
  list: 'List',
  kanban: 'Kanban',
  table: 'Table',
  calendar: 'Calendar',
  timeline: 'Timeline',
}

export function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useWorkspace()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
        {(Object.keys(VIEW_ICONS) as ViewMode[]).map((mode) => {
          const Icon = VIEW_ICONS[mode]
          const active = viewMode === mode
          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    'size-8 rounded-md',
                    active && 'bg-background shadow-sm',
                  )}
                  onClick={() => setViewMode(mode)}
                  aria-label={VIEW_LABELS[mode]}
                >
                  <Icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{VIEW_LABELS[mode]}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export function ViewModeSwitcherCompact() {
  const { viewMode, setViewMode } = useWorkspace()

  return (
    <motion.div layout className="flex gap-1 overflow-x-auto pb-1">
      {(Object.keys(VIEW_ICONS) as ViewMode[]).map((mode) => (
        <Button
          key={mode}
          variant={viewMode === mode ? 'primary' : 'ghost'}
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => setViewMode(mode)}
        >
          {VIEW_LABELS[mode]}
        </Button>
      ))}
    </motion.div>
  )
}
