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
import { cn } from '@/lib/utils'

const EVENT_ICONS = {
  lead_created: UserPlus,
  email_sent: Mail,
  meeting_scheduled: Calendar,
  status_changed: RefreshCw,
  owner_changed: User,
  note_added: MessageSquare,
  call_logged: Phone,
  task_created: Calendar,
  task_completed: CheckCircle2,
  proposal_sent: FileText,
  converted: TrendingUp,
  disqualified: RefreshCw,
  lead_qualified: Target,
  disqualification_reason: MessageSquare,
  follow_up_scheduled: Calendar,
  opportunity_created: Target,
  owner_assigned: User,
}

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

export function LeadTimelinePanel({ events }: { events: LeadTimelineEvent[] }) {
  if (!events.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No timeline events yet.
      </Typography>
    )
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      {events.map((event) => {
        const Icon = EVENT_ICONS[event.type] ?? RefreshCw
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 pl-1">
            <div className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background')}>
              <Icon className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Typography variant="body" className="text-sm font-medium">{event.title}</Typography>
                <Typography variant="caption" tone="muted">{formatTimestamp(event.timestamp)}</Typography>
              </div>
              <Typography variant="caption" tone="muted" className="mt-0.5 leading-relaxed">
                {event.description}
              </Typography>
              <Typography variant="caption" className="mt-1 text-xs text-muted-foreground/80">
                by {event.actor}
              </Typography>
            </div>
          </div>
        )
      })}
    </div>
  )
}
