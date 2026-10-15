import { motion } from 'framer-motion'
import { Activity, DollarSign, Target, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { formatCurrency } from '@/lib/formatters'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import type { Lead, Lead360Profile, LeadExtras } from '@/features/lead-management/types/lead.types'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const STAT_STYLES = [
  { icon: DollarSign, iconClass: 'text-emerald-600', cardClass: 'from-emerald-500/10 via-background to-background' },
  { icon: Target, iconClass: 'text-blue-600', cardClass: 'from-blue-500/10 via-background to-background' },
  { icon: TrendingUp, iconClass: 'text-violet-600', cardClass: 'from-violet-500/10 via-background to-background' },
  { icon: Activity, iconClass: 'text-amber-600', cardClass: 'from-amber-500/10 via-background to-background' },
]

export function Lead360Overview({
  lead,
  profile,
  extras,
}: {
  lead: Lead
  profile: Lead360Profile
  extras: LeadExtras
}) {
  const stats = [
    { label: 'Expected Revenue', value: formatCurrency(lead.expectedRevenue) },
    { label: 'Budget', value: formatCurrency(lead.budget) },
    { label: 'Health Score', value: `${profile.healthScore}%` },
    { label: 'Activities', value: String(extras.activities.length) },
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }, index) => {
          const style = STAT_STYLES[index]!
          const Icon = style.icon
          return (
            <motion.div
              key={label}
              variants={fadeIn}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={cn(
                'rounded-2xl border border-border/50 bg-gradient-to-br p-5 shadow-sm',
                'transition-shadow hover:shadow-md',
                style.cardClass,
              )}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className={cn('flex size-8 items-center justify-center rounded-lg bg-background/80', style.iconClass)}>
                  <Icon className="size-4" />
                </div>
                <Typography variant="caption">{label}</Typography>
              </div>
              <Typography variant="heading-m" className="mt-3 text-2xl font-bold tracking-tight">
                {value}
              </Typography>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={fadeIn} className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-sm">
          <Typography variant="body" className="mb-4 text-sm font-semibold">Lead Summary</Typography>
          <dl className="space-y-3 text-sm">
            <Row label="Status" value={formatWorkflowStatus(lead.status)} highlight />
            <Row label="Priority" value={lead.priority} />
            <Row label="Score" value={String(lead.score)} />
            <Row label="Created" value={lead.createdDate} />
            <Row label="Last Activity" value={lead.lastActivity} />
            <Row label="Next Follow-up" value={lead.nextFollowUp} />
          </dl>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-sm">
          <Typography variant="body" className="mb-4 text-sm font-semibold">Engagement Snapshot</Typography>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{extras.emails.length} emails</Badge>
            <Badge variant="info">{extras.meetings.length} meetings</Badge>
            <Badge variant="info">{extras.notes.length} notes</Badge>
            <Badge variant="info">{extras.activities.filter((a) => a.type === 'call').length} calls</Badge>
            <Badge variant="info">{extras.activities.filter((a) => a.type === 'task').length} tasks</Badge>
          </div>
          {lead.description ? (
            <Typography variant="caption" tone="muted" className="mt-4 leading-relaxed">
              {lead.description}
            </Typography>
          ) : (
            <Typography variant="caption" tone="muted" className="mt-4 italic">
              No description provided yet.
            </Typography>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium capitalize', highlight && 'text-primary')}>{value}</dd>
    </div>
  )
}
