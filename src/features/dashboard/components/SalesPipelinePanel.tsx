import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { formatCurrency } from '@/lib/formatters'
import { useStageDistributionQuery } from '@/features/opportunity-management/hooks/useOpportunityQueries'
import type { OpportunityStage } from '@/features/opportunity-management/types/opportunity.types'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<OpportunityStage, string> = {
  prospect: 'bg-blue-500',
  qualification: 'bg-cyan-500',
  discovery: 'bg-sky-500',
  proposal: 'bg-violet-500',
  commercial_review: 'bg-indigo-500',
  negotiation: 'bg-amber-500',
  legal_review: 'bg-orange-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
}

export function SalesPipelinePanel() {
  const { data: stages, isLoading, isError } = useStageDistributionQuery()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError || !stages?.length) {
    return (
      <Typography variant="caption" tone="muted">
        Unable to load pipeline data.
      </Typography>
    )
  }

  const openStages = stages.filter((s) => s.stage !== 'lost')
  const totalValue = openStages.reduce((sum, s) => sum + s.value, 0)
  const maxValue = Math.max(...openStages.map((s) => s.value), 1)
  const activeCount = openStages
    .filter((s) => s.stage !== 'won')
    .reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography variant="caption" tone="muted">
            Total pipeline value
          </Typography>
          <Typography variant="heading-xl" className="tabular-nums">
            {formatCurrency(totalValue)}
          </Typography>
        </div>
        <div className="text-right">
          <Typography variant="caption" tone="muted">
            Active opportunities
          </Typography>
          <Typography variant="heading-m" className="tabular-nums">
            {activeCount}
          </Typography>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {openStages.map((stage, index) => {
          const widthPercent = (stage.value / maxValue) * 100
          const color = STAGE_COLORS[stage.stage]

          return (
            <motion.div key={stage.stage} variants={fadeIn} custom={index}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <Typography variant="body" className="text-sm font-medium">
                  {stage.label}
                </Typography>
                <div className="flex items-center gap-3">
                  <Typography variant="caption" tone="muted">
                    {stage.count} deals
                  </Typography>
                  <Typography variant="caption" className="font-medium tabular-nums">
                    {formatCurrency(stage.value)}
                  </Typography>
                </div>
              </div>
              <div className="relative h-10 overflow-hidden rounded-lg bg-muted/50">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 rounded-lg opacity-90', color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
                />
                <div className="relative flex h-full items-center px-3">
                  <Typography variant="caption" className="font-medium text-white drop-shadow-sm">
                    {stage.count} · {formatCurrency(stage.weightedValue)} weighted
                  </Typography>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="flex items-center gap-1 text-success">
        <TrendingUp className="size-4" />
        <Typography variant="caption" className="font-medium text-success">
          Live stage distribution from opportunity repository
        </Typography>
      </div>
    </div>
  )
}
