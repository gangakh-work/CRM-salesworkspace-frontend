import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Target } from 'lucide-react'

import { EmptyState } from '@/components/global/EmptyState'
import { CardGridSkeleton } from '@/components/patterns/skeletons'
import { Button } from '@/components/ui/button'
import { OpportunityFiltersPanel } from '@/features/opportunity-management/components/OpportunityFiltersPanel'
import { OpportunityTable } from '@/features/opportunity-management/components/OpportunityTable'
import { OpportunityToolbar } from '@/features/opportunity-management/components/OpportunityToolbar'
import { OpportunityCalendarView } from '@/features/opportunity-management/components/views/OpportunityCalendarView'
import { OpportunityForecastView } from '@/features/opportunity-management/components/views/OpportunityForecastView'
import { OpportunityKanbanView } from '@/features/opportunity-management/components/views/OpportunityKanbanView'
import { OpportunityPipelineView } from '@/features/opportunity-management/components/views/OpportunityPipelineView'
import { OpportunityTimelineView } from '@/features/opportunity-management/components/views/OpportunityTimelineView'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { pageTransition } from '@/design-system/animations/motion'

function OpportunityContent() {
  const { viewMode, isLoading, loadError, filteredOpportunities, refresh } = useOpportunityManagement()

  if (isLoading) {
    return <CardGridSkeleton className="p-4" itemClassName="h-32 rounded-xl" />
  }

  if (loadError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load opportunities"
          description={loadError}
          action={
            <Button variant="outline" onClick={() => void refresh()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (filteredOpportunities.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Target}
          title="No opportunities found"
          description="Adjust your filters or create a new opportunity in Dataverse."
        />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="p-4"
      >
        {viewMode === 'table' && <OpportunityTable />}
        {viewMode === 'kanban' && <OpportunityKanbanView />}
        {viewMode === 'pipeline' && <OpportunityPipelineView />}
        {viewMode === 'timeline' && <OpportunityTimelineView />}
        {viewMode === 'calendar' && <OpportunityCalendarView />}
        {viewMode === 'forecast' && <OpportunityForecastView />}
      </motion.div>
    </AnimatePresence>
  )
}

export function OpportunityManagementListPage() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <OpportunityToolbar />
      <OpportunityFiltersPanel />
      <div className="min-h-0 flex-1 overflow-auto">
        <OpportunityContent />
      </div>
    </div>
  )
}
