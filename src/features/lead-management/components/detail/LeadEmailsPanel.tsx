import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type { LeadEmail } from '@/features/lead-management/types/lead.types'

export function LeadEmailsPanel({ emails }: { emails: LeadEmail[] }) {
  if (!emails.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No emails yet.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div key={email.id} className="rounded-lg border px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {email.direction === 'outbound' ? (
                <ArrowUpRight className="size-4 text-primary" />
              ) : (
                <ArrowDownLeft className="size-4 text-emerald-600" />
              )}
              <Typography variant="body" className="text-sm font-semibold">{email.subject}</Typography>
            </div>
            <Badge variant="secondary" className="capitalize">{email.status}</Badge>
          </div>
          <Typography variant="caption" tone="muted" className="mt-2 line-clamp-2">
            {email.preview}
          </Typography>
          <Typography variant="caption" className="mt-1 text-xs text-muted-foreground">
            {email.sentAt}
          </Typography>
        </div>
      ))}
    </div>
  )
}
