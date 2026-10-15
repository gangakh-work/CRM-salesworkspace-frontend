import { motion } from 'framer-motion'
import { Calendar, FileText, RefreshCw, UserPlus } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import type { OpportunityTimelineEvent } from '@/features/opportunity-management/types/opportunity.types'
import { staggerContainer, fadeIn } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const EVENT_ICONS: Record<string, typeof RefreshCw> = {
  created: UserPlus,
  stage_changed: RefreshCw,
  proposal_sent: FileText,
  proposal_generated: FileText,
  meeting_scheduled: Calendar,
}

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

export function OpportunityTimeline({ events }: { events: OpportunityTimelineEvent[] }) {
  if (!events.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-12 text-center">
        No timeline events yet.
      </Typography>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative pl-2">
      <div className="absolute bottom-3 left-[1.125rem] top-3 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
      <div className="space-y-1">
        {events.map((event, index) => {
          const Icon = EVENT_ICONS[event.type] ?? RefreshCw
          return (
            <motion.div key={event.id} variants={fadeIn} custom={index} className="relative flex gap-4 pb-6">
              <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/10 shadow-sm">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-card/50 p-3 transition-colors hover:border-primary/20 hover:bg-card/80">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Typography variant="body" className="text-sm font-semibold">{event.title}</Typography>
                  <Typography variant="caption" tone="muted" className="shrink-0 text-xs">
                    {formatTimestamp(event.timestamp)}
                  </Typography>
                </div>
                <Typography variant="caption" tone="muted" className="mt-1 leading-relaxed">
                  {event.description}
                </Typography>
                <Typography variant="caption" className={cn('mt-2 text-xs text-muted-foreground/70')}>
                  {event.actor}
                </Typography>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
