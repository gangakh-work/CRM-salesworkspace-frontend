import { motion } from 'framer-motion'
import { AlertCircle, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/global/EmptyState'
import { CardGridSkeleton } from '@/components/patterns/skeletons'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot, useRegisterAiContext } from '@/features/ai-copilot/context/AiCopilotProvider'
import { Opportunity360CenterPanel } from '@/features/opportunity-management/components/workspace360/Opportunity360CenterPanel'
import {
  Opportunity360BackLink,
  Opportunity360LeftPanel,
} from '@/features/opportunity-management/components/workspace360/Opportunity360LeftPanel'
import { Opportunity360QuickToolbar } from '@/features/opportunity-management/components/workspace360/Opportunity360QuickToolbar'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { useOpportunityDetailQuery } from '@/features/opportunity-management/hooks/useOpportunityQueries'
import { pageTransition } from '@/design-system/animations/motion'

export function Opportunity360Page() {
  const { id } = useParams<{ id: string }>()
  const { opportunities, opportunityExtras } = useOpportunityManagement()
  const detailQuery = useOpportunityDetailQuery(id)
  const { open, isOpen: isCopilotOpen } = useAiCopilot()

  const contextOpp = opportunities.find((o) => o.id === id)
  const opp = contextOpp ?? detailQuery.data?.opportunity
  const extras = id ? opportunityExtras[id] ?? detailQuery.data?.extras : undefined

  useRegisterAiContext(
    opp
      ? {
          page: `/workspace/opportunities/${opp.id}`,
          pageLabel: 'Opportunity 360° Workspace',
          entityType: 'opportunity',
          entityId: opp.id,
          entityName: opp.name,
          metadata: {
            customer: opp.customer,
            stage: opp.stage,
            probability: String(opp.probability),
            owner: opp.owner,
          },
        }
      : null,
  )

  // Open the assistant docked the first time a record is shown — but never
  // override a layout the user already chose (e.g. full screen), and don't
  // re-run when the record data refreshes.
  const autoOpenedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!opp || autoOpenedFor.current === opp.id) return
    autoOpenedFor.current = opp.id
    if (!isCopilotOpen) open({ mode: 'docked' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per record id
  }, [opp?.id])

  if (detailQuery.isLoading && !opp) {
    return (
      <div className="p-6">
        <CardGridSkeleton itemClassName="h-40 rounded-xl" />
      </div>
    )
  }

  if (detailQuery.isError && !contextOpp) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load opportunity"
          description={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : 'Failed to fetch opportunity from Dataverse.'
          }
          action={
            <Button variant="outline" onClick={() => void detailQuery.refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (!opp || !extras) {
    return <Navigate to="/workspace/opportunities" replace />
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background/40"
    >
      <header className="shrink-0 border-b border-border/60 bg-gradient-to-r from-background via-primary/5 to-violet-500/5 px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Opportunity360BackLink />
            <div className="mt-1 flex items-center gap-2">
              <Typography variant="heading-m" className="truncate text-lg md:text-xl">
                {opp.name}
              </Typography>
              <Sparkles className="size-4 shrink-0 text-primary/60" />
            </div>
            <Typography variant="caption" tone="muted">
              Opportunity 360° · {opp.customer} · {opp.owner}
            </Typography>
          </div>
          <Opportunity360QuickToolbar opp={opp} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="max-h-[40vh] shrink-0 overflow-y-auto xl:max-h-none xl:w-72 xl:shrink-0">
          <Opportunity360LeftPanel opp={opp} />
        </div>

        <Opportunity360CenterPanel opp={opp} extras={extras} />
      </div>
    </motion.div>
  )
}
