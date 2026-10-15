import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { LeadScoreBadge, PriorityBadge } from '@/features/lead-management/components/LeadBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToLead } from '@/features/lead-management/hooks/useNavigateToLead'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { KANBAN_COLUMNS } from '@/features/lead-management/types/lead.types'

import { cardHover, fadeIn, staggerContainer } from '@/design-system/animations/motion'

export function LeadKanbanView() {
  const { filteredLeads } = useLeadManagement()
  const navigateToLead = useNavigateToLead()

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex gap-4 overflow-x-auto pb-4"
    >
      {KANBAN_COLUMNS.map((column) => {
        const items = filteredLeads.filter((l) => l.kanbanColumn === column)
        return (
          <motion.div
            key={column}
            variants={fadeIn}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Typography variant="body" className="text-sm font-semibold">{column}</Typography>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="space-y-3 p-3">
              {items.map((lead) => (
                <motion.div key={lead.id} initial="rest" whileHover="hover" variants={cardHover}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border/60 bg-card/80 p-3 text-left backdrop-blur-sm transition-colors hover:border-primary/30"
                    onClick={() => navigateToLead(lead)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="body" className="text-sm font-semibold">{lead.name}</Typography>
                      <LeadScoreBadge score={lead.score} />
                    </div>
                    <Typography variant="caption" tone="muted">{lead.company}</Typography>
                    <div className="mt-2 flex items-center justify-between">
                      <PriorityBadge priority={lead.priority} />
                      {lead.expectedRevenue && (
                        <Typography variant="caption" className="font-medium">{formatCurrency(lead.expectedRevenue)}</Typography>
                      )}
                    </div>
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
