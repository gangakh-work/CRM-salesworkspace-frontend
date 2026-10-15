import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { PriorityBadge, ProbabilityBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { PIPELINE_KANBAN_COLUMNS } from '@/features/opportunity-management/types/opportunity.types'
import { cardHover, fadeIn, staggerContainer } from '@/design-system/animations/motion'

export function OpportunityKanbanView() {
  const { filteredOpportunities } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex gap-4 overflow-x-auto pb-4"
    >
      {PIPELINE_KANBAN_COLUMNS.map((column) => {
        const items = filteredOpportunities.filter((o) => o.kanbanColumn === column)
        const total = items.reduce((s, o) => s + o.expectedRevenue, 0)
        return (
          <motion.div
            key={column}
            variants={fadeIn}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/20 backdrop-blur-sm"
          >
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <Typography variant="body" className="text-sm font-semibold">
                  {column}
                </Typography>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <Typography variant="caption" tone="muted">
                {formatCurrency(total)}
              </Typography>
            </div>
            <div className="space-y-3 p-3">
              {items.map((opp) => (
                <motion.div key={opp.id} initial="rest" whileHover="hover" variants={cardHover}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border/60 bg-card/80 p-3 text-left backdrop-blur-sm transition-colors hover:border-primary/30"
                    onClick={() => navigateToOpportunity(opp)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="body" className="text-sm font-semibold">
                        {opp.name}
                      </Typography>
                      <ProbabilityBadge probability={opp.probability} />
                    </div>
                    <Typography variant="caption" tone="muted">
                      {opp.customer}
                    </Typography>
                    <div className="mt-2 flex items-center justify-between">
                      <PriorityBadge priority={opp.priority} />
                      <Typography variant="caption" className="font-medium">
                        {formatCurrency(opp.expectedRevenue, opp.currency)}
                      </Typography>
                    </div>
                    <Typography variant="caption" tone="muted" className="mt-1 block">
                      Close {opp.closeDate}
                    </Typography>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
