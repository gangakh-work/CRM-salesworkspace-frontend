import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, FolderOpen } from 'lucide-react'

import { EmptyState } from '@/components/global/EmptyState'
import { CardGridSkeleton } from '@/components/patterns/skeletons'
import { Button } from '@/components/ui/button'
import { CardsView } from '@/features/crm-workspace/components/views/CardsView'
import { CalendarView } from '@/features/crm-workspace/components/views/CalendarView'
import { KanbanView } from '@/features/crm-workspace/components/views/KanbanView'
import { ListView } from '@/features/crm-workspace/components/views/ListView'
import { TableView } from '@/features/crm-workspace/components/views/TableView'
import { TimelineView } from '@/features/crm-workspace/components/views/TimelineView'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { pageTransition } from '@/design-system/animations/motion'

function WorkspaceSkeleton() {
  return <CardGridSkeleton itemClassName="h-36 rounded-xl" />
}

export function WorkspaceContent() {
  const { viewMode, isRefreshing, isLoading, loadError, records, refresh } = useWorkspace()

  const ViewComponent = {
    cards: CardsView,
    list: ListView,
    kanban: KanbanView,
    table: TableView,
    calendar: CalendarView,
    timeline: TimelineView,
  }[viewMode]

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <WorkspaceSkeleton />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load workspace data"
          description={loadError}
          action={
            <Button variant="outline" onClick={refresh}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <EmptyState
          icon={FolderOpen}
          title="No records found"
          description="Adjust filters or create a new record in Dataverse to see it here."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <AnimatePresence mode="wait">
        {isRefreshing ? (
          <motion.div key="loading" {...pageTransition}>
            <WorkspaceSkeleton />
          </motion.div>
        ) : (
          <motion.div key={viewMode} initial="initial" animate="animate" exit="exit" variants={pageTransition}>
            <ViewComponent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
