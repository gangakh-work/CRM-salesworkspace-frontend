import { Calendar, CheckSquare, Mail, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type { LeadActivity } from '@/features/lead-management/types/lead.types'
import { cn } from '@/lib/utils'

const TYPE_ICONS = { call: Phone, email: Mail, meeting: Calendar, task: CheckSquare }

const STATUS_VARIANT = {
  planned: 'info' as const,
  completed: 'success' as const,
  cancelled: 'neutral' as const,
}

export function LeadActivitiesPanel({ activities }: { activities: LeadActivity[] }) {
  const grouped = {
    call: activities.filter((a) => a.type === 'call'),
    email: activities.filter((a) => a.type === 'email'),
    meeting: activities.filter((a) => a.type === 'meeting'),
    task: activities.filter((a) => a.type === 'task'),
  }

  if (!activities.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No activities yet. Use quick actions to log calls, emails, meetings, or tasks.
      </Typography>
    )
  }

  return (
    <div className="space-y-6">
      {(['call', 'email', 'meeting', 'task'] as const).map((type) => {
        const items = grouped[type]
        if (!items.length) return null
        const Icon = TYPE_ICONS[type]
        return (
          <section key={type}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="size-4 text-primary" />
              <Typography variant="body" className="text-sm font-semibold capitalize">{type}s</Typography>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.map((act) => (
                <div key={act.id} className="rounded-lg border bg-muted/20 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <Typography variant="body" className="text-sm font-medium">{act.subject}</Typography>
                    <Badge variant={STATUS_VARIANT[act.status]} className="capitalize shrink-0">{act.status}</Badge>
                  </div>
                  {act.description && (
                    <Typography variant="caption" tone="muted" className="mt-1">{act.description}</Typography>
                  )}
                  <div className={cn('mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground')}>
                    <span>{act.owner}</span>
                    {act.dueDate && <span>Due {act.dueDate}</span>}
                    <span>{act.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
