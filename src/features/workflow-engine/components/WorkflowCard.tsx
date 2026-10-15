import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { getTemplate } from '@/features/workflow-engine/lib/workflow-definitions'
import { CATEGORY_COLORS, formatWorkflowStatus } from '@/features/workflow-engine/lib/workflow-engine'
import type { WorkflowInstance } from '@/features/workflow-engine/types/workflow.types'
import { ProgressIndicator } from '@/features/workflow-engine/components/ProgressIndicator'
import { cn } from '@/lib/utils'

export function WorkflowCard({
  workflow,
  onClick,
  selected,
}: {
  workflow: WorkflowInstance
  onClick?: () => void
  selected?: boolean
}) {
  const template = getTemplate(workflow.templateId)
  const pendingApprovals = workflow.approvals.filter((a) => a.status === 'pending').length

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-border/60 bg-card/60 p-4 text-left backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-elevation-1',
        selected && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography variant="body" className="truncate text-sm font-semibold">
            {workflow.name}
          </Typography>
          <Typography variant="caption" tone="muted">
            {template?.name} · {workflow.owner}
          </Typography>
        </div>
        <Badge
          variant={
            workflow.status === 'completed'
              ? 'success'
              : workflow.status === 'paused'
                ? 'warning'
                : workflow.status === 'cancelled'
                  ? 'neutral'
                  : 'info'
          }
          className="shrink-0 capitalize"
        >
          {formatWorkflowStatus(workflow.status)}
        </Badge>
      </div>

      {workflow.entityName && (
        <Typography variant="caption" tone="muted" className="mt-1 block">
          {workflow.entityType}: {workflow.entityName}
        </Typography>
      )}

      <div className="mt-3">
        <ProgressIndicator value={workflow.progress} size="sm" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {template && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', CATEGORY_COLORS[template.category])}>
            {template.category}
          </span>
        )}
        {pendingApprovals > 0 && (
          <Badge variant="warning">{pendingApprovals} pending approval{pendingApprovals > 1 ? 's' : ''}</Badge>
        )}
        <Typography variant="caption" tone="muted" className="ml-auto">
          Updated {workflow.updatedAt.slice(0, 10)}
        </Typography>
      </div>
    </button>
  )
}
