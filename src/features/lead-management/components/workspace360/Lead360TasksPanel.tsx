import { CheckSquare } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { LeadActivity } from '@/features/lead-management/types/lead.types'
import { toast as sonnerToast } from 'sonner'

export function Lead360TasksPanel({ tasks }: { tasks: LeadActivity[] }) {
  if (!tasks.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No tasks yet. Create one from the quick action toolbar.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CheckSquare className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <Typography variant="body" className="text-sm font-medium">{task.subject}</Typography>
            <Typography variant="caption" tone="muted">
              {task.owner}{task.dueDate ? ` · Due ${task.dueDate}` : ''}
            </Typography>
          </div>
          <Badge variant={task.status === 'completed' ? 'success' : 'info'} className="capitalize shrink-0">
            {task.status}
          </Badge>
          {task.status === 'planned' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => sonnerToast.success('Task marked complete')}
            >
              Complete
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
