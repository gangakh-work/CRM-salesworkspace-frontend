import { motion } from 'framer-motion'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Typography } from '@/components/ui/typography'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { useLeadFunnelQuery } from '@/features/dashboard/hooks/useDashboardQueries'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import { cn } from '@/lib/utils'

const FUNNEL_STAGES = [
  'draft',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'converted',
  'disqualified',
] as const

const STAGE_COLORS: Record<string, string> = {
  draft: 'bg-slate-500',
  contacted: 'bg-blue-500',
  qualified: 'bg-emerald-500',
  proposal_sent: 'bg-indigo-500',
  negotiation: 'bg-amber-500',
  converted: 'bg-teal-500',
  disqualified: 'bg-red-500',
}

export function LeadFunnelPanel() {
  const query = useLeadFunnelQuery()

  return (
    <AsyncBoundary
      isLoading={query.isLoading || !query.data}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Typography variant="caption" tone="muted">Loading funnel...</Typography>}
      errorTitle="Unable to load lead funnel"
    >
      {(() => {
        const counts = query.data ?? {}
        const max = Math.max(...FUNNEL_STAGES.map((s) => counts[s] ?? 0), 1)

        return (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
            {FUNNEL_STAGES.map((stage, index) => {
              const count = counts[stage] ?? 0
              const width = (count / max) * 100
              return (
                <motion.div key={stage} variants={fadeIn} custom={index}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <Typography variant="body" className="text-xs font-medium">
                      {formatWorkflowStatus(stage)}
                    </Typography>
                    <Typography variant="caption" className="text-[11px] font-medium tabular-nums">
                      {count}
                    </Typography>
                  </div>
                  <div className="relative h-5 overflow-hidden rounded-md bg-muted/50">
                    <div
                      className={cn('absolute inset-y-0 left-0 rounded-lg opacity-90', STAGE_COLORS[stage])}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )
      })()}
    </AsyncBoundary>
  )
}
