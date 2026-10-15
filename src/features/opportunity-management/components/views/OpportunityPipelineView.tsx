import { motion } from 'framer-motion'

import { Typography } from '@/components/ui/typography'
import { StageBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { STAGE_ORDER, formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

export function OpportunityPipelineView() {
  const { filteredOpportunities } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()

  const stages = [...STAGE_ORDER, 'lost' as const]
  const maxRevenue = Math.max(
    ...stages.map((s) =>
      filteredOpportunities.filter((o) => o.stage === s).reduce((sum, o) => sum + o.expectedRevenue, 0),
    ),
    1,
  )

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => {
          const items = filteredOpportunities.filter((o) => o.stage === stage)
          const total = items.reduce((s, o) => s + o.expectedRevenue, 0)
          const weighted = items.reduce((s, o) => s + o.expectedRevenue * (o.probability / 100), 0)
          return (
            <motion.div
              key={stage}
              variants={fadeIn}
              className="rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm"
            >
              <StageBadge stage={stage} />
              <Typography variant="heading-m" className="mt-2">
                {formatCurrency(total)}
              </Typography>
              <Typography variant="caption" tone="muted">
                {items.length} deals · Weighted {formatCurrency(weighted)}
              </Typography>
            </motion.div>
          )
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
        <Typography variant="heading-m" className="text-sm">Pipeline Funnel</Typography>
        {stages.map((stage) => {
          const items = filteredOpportunities.filter((o) => o.stage === stage)
          const total = items.reduce((s, o) => s + o.expectedRevenue, 0)
          const pct = (total / maxRevenue) * 100
          return (
            <div key={stage} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{formatStage(stage)}</span>
                <span className="text-muted-foreground">
                  {items.length} · {formatCurrency(total)}
                </span>
              </div>
              <div className="h-5 overflow-hidden rounded-md bg-muted/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={cn(
                    'flex h-full items-center px-3 text-xs font-medium text-white',
                    stage === 'won'
                      ? 'bg-emerald-500'
                      : stage === 'lost'
                        ? 'bg-red-400'
                        : 'bg-primary/80',
                  )}
                >
                  {pct > 15 && formatCurrency(total)}
                </motion.div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {items.slice(0, 4).map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => navigateToOpportunity(opp)}
                    className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs hover:border-primary/40"
                  >
                    {opp.name}
                  </button>
                ))}
                {items.length > 4 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">+{items.length - 4} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
