import { Calendar, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type { LeadMeeting } from '@/features/lead-management/types/lead.types'

export function LeadMeetingsPanel({ meetings }: { meetings: LeadMeeting[] }) {
  if (!meetings.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No meetings scheduled.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="rounded-lg border px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="body" className="text-sm font-semibold">{meeting.title}</Typography>
            <Badge variant={meeting.status === 'scheduled' ? 'info' : meeting.status === 'completed' ? 'success' : 'neutral'} className="capitalize">
              {meeting.status}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {meeting.scheduledAt.slice(0, 10)} at {meeting.scheduledAt.slice(11, 16)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {meeting.duration}
            </span>
          </div>
          <Typography variant="caption" tone="muted" className="mt-1">
            Attendees: {meeting.attendees}
          </Typography>
        </div>
      ))}
    </div>
  )
}
