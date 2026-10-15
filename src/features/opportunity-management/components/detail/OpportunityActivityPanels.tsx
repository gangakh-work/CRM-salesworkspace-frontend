import { Calendar, CheckSquare, Mail, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type {
  OpportunityActivity,
  OpportunityExtras,
} from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'

const TYPE_ICONS = { call: Phone, email: Mail, meeting: Calendar, task: CheckSquare }

export function OpportunityActivitiesPanel({ activities }: { activities: OpportunityActivity[] }) {
  if (!activities.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No activities yet.
      </Typography>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = TYPE_ICONS[activity.type]
        return (
          <div key={activity.id} className="flex gap-3 rounded-xl border border-border/60 p-4">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10')}>
              <Icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="body" className="text-sm font-semibold">{activity.subject}</Typography>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">{activity.type}</Badge>
                <Badge variant={activity.status === 'completed' ? 'success' : 'info'} className="capitalize">
                  {activity.status}
                </Badge>
              </div>
              <Typography variant="caption" tone="muted" className="mt-1 block">
                {activity.owner} · {activity.createdAt}
              </Typography>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OpportunityMeetingsPanel({
  meetings,
}: {
  meetings: OpportunityExtras['meetings']
}) {
  if (!meetings.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No meetings scheduled.
      </Typography>
    )
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="rounded-xl border border-border/60 p-4">
          <Typography variant="body" className="font-semibold">{meeting.title}</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            {new Date(meeting.scheduledAt).toLocaleString()}
          </Typography>
          <Badge variant="info" className="mt-2 capitalize">{meeting.status}</Badge>
        </div>
      ))}
    </div>
  )
}

export function OpportunityEmailsPanel({
  emails,
}: {
  emails: OpportunityExtras['emails']
}) {
  if (!emails.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No emails logged.
      </Typography>
    )
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <div key={email.id} className="rounded-xl border border-border/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="body" className="text-sm font-semibold">{email.subject}</Typography>
            <Badge variant={email.direction === 'outbound' ? 'info' : 'secondary'} className="capitalize">
              {email.direction}
            </Badge>
          </div>
          <Typography variant="caption" tone="muted" className="mt-1 block">{email.preview}</Typography>
          <Typography variant="caption" className="mt-2 text-xs text-muted-foreground">{email.sentAt}</Typography>
        </div>
      ))}
    </div>
  )
}
