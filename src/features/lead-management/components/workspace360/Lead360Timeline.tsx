import { motion } from 'framer-motion'
import {
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Target,
  TrendingUp,
  User,
  UserPlus,
} from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import type { LeadTimelineEvent } from '@/features/lead-management/types/lead.types'
import { staggerContainer, fadeIn } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const EVENT_CONFIG: Record<
  LeadTimelineEvent['type'],
  { icon: typeof Mail; color: string; bg: string }
> = {
  lead_created: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  email_sent: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-500/15' },
  meeting_scheduled: { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500/15' },
  status_changed: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-500/15' },
  owner_changed: { icon: User, color: 'text-slate-600', bg: 'bg-slate-500/15' },
  note_added: { icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-500/15' },
  call_logged: { icon: Phone, color: 'text-indigo-600', bg: 'bg-indigo-500/15' },
  task_created: { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-500/15' },
  task_completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  proposal_sent: { icon: FileText, color: 'text-primary', bg: 'bg-primary/15' },
  converted: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  disqualified: { icon: RefreshCw, color: 'text-destructive', bg: 'bg-destructive/15' },
  lead_qualified: { icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  disqualification_reason: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-500/15' },
  follow_up_scheduled: { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500/15' },
  opportunity_created: { icon: Target, color: 'text-primary', bg: 'bg-primary/15' },
  owner_assigned: { icon: User, color: 'text-slate-600', bg: 'bg-slate-500/15' },
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

export function Lead360Timeline({ events }: { events: LeadTimelineEvent[] }) {
  if (!events.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-12 text-center">
        No timeline events yet.
      </Typography>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative pl-2">
      <div className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
      <div className="space-y-1">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.status_changed
          const Icon = config.icon
          return (
            <motion.div
              key={event.id}
              variants={fadeIn}
              custom={index}
              className="relative flex gap-4 pb-6"
            >
              <div
                className={cn(
                  'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 shadow-sm',
                  config.bg,
                )}
              >
                <Icon className={cn('size-4', config.color)} />
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
                <Typography variant="caption" className="mt-2 text-xs text-muted-foreground/70">
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
