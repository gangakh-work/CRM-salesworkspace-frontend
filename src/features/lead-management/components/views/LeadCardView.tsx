import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { LeadScoreBadge, PriorityBadge, StatusBadge } from '@/features/lead-management/components/LeadBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToLead } from '@/features/lead-management/hooks/useNavigateToLead'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { cardHover, staggerContainer } from '@/design-system/animations/motion'

export function LeadCardView() {
  const { filteredLeads } = useLeadManagement()
  const navigateToLead = useNavigateToLead()

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredLeads.map((lead, i) => (
        <motion.div key={lead.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover="hover" variants={cardHover}>
          <Card
            className="cursor-pointer border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30"
            onClick={() => navigateToLead(lead)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Typography variant="body" className="font-semibold">{lead.name}</Typography>
                  <Typography variant="caption" tone="muted">{lead.title} · {lead.company}</Typography>
                </div>
                <LeadScoreBadge score={lead.score} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Industry</span><p className="font-medium">{lead.industry}</p></div>
                <div><span className="text-muted-foreground">Revenue</span><p className="font-medium">{formatCurrency(lead.expectedRevenue)}</p></div>
                <div><span className="text-muted-foreground">Owner</span><p className="font-medium">{lead.owner}</p></div>
                <div><span className="text-muted-foreground">Follow-up</span><p className="font-medium">{lead.nextFollowUp}</p></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
