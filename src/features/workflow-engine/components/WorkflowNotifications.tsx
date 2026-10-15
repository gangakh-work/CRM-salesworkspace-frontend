import { Bell, CheckCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useWorkflowEngine } from '@/features/workflow-engine/context/WorkflowEngineProvider'
import { cn } from '@/lib/utils'

export function WorkflowNotificationsPanel() {
  const { workflows, markNotificationRead, markAllNotificationsRead, unreadNotifications } = useWorkflowEngine()

  const allNotifications = workflows
    .flatMap((w) => w.notifications.map((n) => ({ ...n, workflowName: w.name })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <Typography variant="body" className="text-sm font-semibold">Notifications</Typography>
          {unreadNotifications > 0 && <Badge variant="warning">{unreadNotifications}</Badge>}
        </div>
        {unreadNotifications > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={markAllNotificationsRead}>
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {allNotifications.slice(0, 10).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => markNotificationRead(n.workflowId, n.id)}
            className={cn(
              'flex w-full gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/30',
              n.read ? 'border-border/40 bg-card/30 opacity-70' : 'border-primary/20 bg-primary/5',
            )}
          >
            <div
              className={cn(
                'mt-0.5 size-2 shrink-0 rounded-full',
                n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : n.type === 'approval' ? 'bg-violet-500' : 'bg-primary',
              )}
            />
            <div className="min-w-0 flex-1">
              <Typography variant="body" className="text-sm font-medium">{n.title}</Typography>
              <Typography variant="caption" tone="muted">{n.message}</Typography>
              <Typography variant="caption" className="mt-1 block text-xs text-muted-foreground/70">
                {n.workflowName} · {new Date(n.timestamp).toLocaleString()}
              </Typography>
            </div>
          </button>
        ))}
        {!allNotifications.length && (
          <Typography variant="caption" tone="muted" className="py-6 text-center">
            No notifications.
          </Typography>
        )}
      </div>
    </div>
  )
}
