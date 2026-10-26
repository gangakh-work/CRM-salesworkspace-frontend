import { motion } from 'framer-motion'
import { AlertCircle, UserRound } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/global/EmptyState'
import { CardGridSkeleton } from '@/components/patterns/skeletons'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useRegisterAiContext } from '@/features/ai-copilot/context/AiCopilotProvider'
import { Lead360BackLink, Lead360LeftPanel } from '@/features/lead-management/components/workspace360/Lead360LeftPanel'
import { Lead360CenterPanel } from '@/features/lead-management/components/workspace360/Lead360CenterPanel'
import { Lead360QuickToolbar } from '@/features/lead-management/components/workspace360/Lead360QuickToolbar'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { useLeadDetailQuery } from '@/features/lead-management/hooks/useLeadQueries'
import { buildLead360Profile } from '@/features/lead-management/lib/lead-360'
import { pageTransition } from '@/design-system/animations/motion'

export function Lead360Page() {
  const { id } = useParams<{ id: string }>()
  const { leads, leadExtras } = useLeadManagement()
  const detailQuery = useLeadDetailQuery(id)

  const contextLead = leads.find((l) => l.id === id)
  const lead = contextLead ?? detailQuery.data?.lead
  const extras = id ? leadExtras[id] ?? detailQuery.data?.extras : undefined

  useRegisterAiContext(
    lead
      ? {
          page: `/workspace/leads/${lead.id}`,
          pageLabel: 'Lead 360° Workspace',
          entityType: 'lead',
          entityId: lead.id,
          entityName: lead.name,
          metadata: {
            company: lead.company,
            status: lead.status,
            score: String(lead.score),
            owner: lead.owner,
          },
        }
      : null,
  )

  if (detailQuery.isLoading && !lead) {
    return (
      <div className="p-6">
        <CardGridSkeleton itemClassName="h-40 rounded-xl" />
      </div>
    )
  }

  if (detailQuery.isError && !contextLead) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load lead"
          description={detailQuery.error instanceof Error ? detailQuery.error.message : 'Failed to fetch lead from Dataverse.'}
          action={
            <Button variant="outline" onClick={() => void detailQuery.refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  if (!lead || !extras) {
    return <Navigate to="/workspace/leads" replace />
  }

  const profile = buildLead360Profile(lead)

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20"
    >
      <header className="relative shrink-0 overflow-hidden border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-violet-500/10" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Lead360BackLink />
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 shadow-sm">
                <UserRound className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <Typography variant="heading-m" className="truncate text-xl md:text-2xl">
                  {lead.name}
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-0.5">
                  Lead 360° · {lead.company} · {lead.owner}
                </Typography>
              </div>
            </div>
          </div>
          <div className="shrink-0 xl:max-w-[60%]">
            <Lead360QuickToolbar lead={lead} />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="max-h-[40vh] shrink-0 overflow-y-auto xl:max-h-none xl:w-72 xl:shrink-0">
          <Lead360LeftPanel lead={lead} profile={profile} />
        </div>

        <Lead360CenterPanel lead={lead} profile={profile} extras={extras} />
      </div>
    </motion.div>
  )
}
