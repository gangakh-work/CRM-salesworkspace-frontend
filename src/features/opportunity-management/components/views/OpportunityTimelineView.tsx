import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { StageBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'

export function OpportunityTimelineView() {
  const { filteredOpportunities } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()

  const sorted = [...filteredOpportunities].sort((a, b) => a.closeDate.localeCompare(b.closeDate))
  const byMonth = sorted.reduce<Record<string, typeof sorted>>((acc, opp) => {
    const month = opp.closeDate.slice(0, 7)
    acc[month] = acc[month] ?? []
    acc[month].push(opp)
    return acc
  }, {})

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative space-y-8 pl-6">
      <div className="absolute bottom-0 left-2 top-0 w-px bg-border" />
      {Object.entries(byMonth).map(([month, opps]) => (
        <motion.div key={month} variants={fadeIn} className="relative">
          <div className="absolute -left-6 top-1 size-3 rounded-full border-2 border-primary bg-background" />
          <Typography variant="heading-m" className="mb-3 capitalize">
            {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <div className="space-y-3">
            {opps.map((opp) => (
              <button
                key={opp.id}
                type="button"
                onClick={() => navigateToOpportunity(opp)}
                className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4 text-left transition-colors hover:border-primary/30"
              >
                <div>
                  <Typography variant="body" className="font-semibold">
                    {opp.name}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {opp.customer} · {opp.owner}
                  </Typography>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StageBadge stage={opp.stage} />
                    <Badge variant="secondary">{opp.closeDate}</Badge>
                  </div>
                </div>
                <Typography variant="body" className="font-bold">
                  {formatCurrency(opp.expectedRevenue, opp.currency)}
                </Typography>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
