import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Target } from 'lucide-react'

import { EmptyState } from '@/components/global/EmptyState'
import { CardGridSkeleton } from '@/components/patterns/skeletons'
import { Button } from '@/components/ui/button'
import { LeadFiltersPanel } from '@/features/lead-management/components/LeadFiltersPanel'
import { LeadTable } from '@/features/lead-management/components/LeadTable'
import { LeadToolbar } from '@/features/lead-management/components/LeadToolbar'
import { LeadDraftsSection } from '@/features/lead-management/components/LeadDraftsSection'
import { LeadCardView } from '@/features/lead-management/components/views/LeadCardView'
import { LeadKanbanView } from '@/features/lead-management/components/views/LeadKanbanView'
import { LeadTimelineView } from '@/features/lead-management/components/views/LeadTimelineView'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { pageTransition } from '@/design-system/animations/motion'

function LeadContent() {
  const {
    viewMode,
    showDrafts,
    isLoading,
    loadError,
    filteredLeads,
    refresh,
  } = useLeadManagement()

  if (showDrafts) {
    return <LeadDraftsSection />
  }

  if (isLoading) {
    return (
      <CardGridSkeleton
        className="p-4"
        itemClassName="h-32 rounded-xl"
      />
    )
  }

  if (loadError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load leads"
          description={loadError}
          action={
            <Button
              variant="outline"
              onClick={() => void refresh()}
            >
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (filteredLeads.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Target}
          title="No leads found"
          description="Create a new lead or adjust your filters to see results from Dataverse."
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
        {viewMode === 'table' && <LeadTable />}
        {viewMode === 'kanban' && <LeadKanbanView />}
        {viewMode === 'cards' && <LeadCardView />}
        {viewMode === 'timeline' && <LeadTimelineView />}
      </motion.div>
    </AnimatePresence>
  )
}

export function LeadManagementListPage() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <LeadToolbar />
      <LeadFiltersPanel />

      <div className="min-h-0 flex-1 overflow-auto">
        <LeadContent />
      </div>
    </div>
  )
}