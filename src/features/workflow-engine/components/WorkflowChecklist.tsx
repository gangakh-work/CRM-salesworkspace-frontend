import { Check } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import type { WorkflowChecklistItem } from '@/features/workflow-engine/types/workflow.types'
import { cn } from '@/lib/utils'

export function WorkflowChecklist({
  items,
  onToggle,
  readonly = false,
}: {
  items: WorkflowChecklistItem[]
  onToggle?: (itemId: string) => void
  readonly?: boolean
}) {
  if (!items.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-4 text-center">
        No checklist items for this workflow.
      </Typography>
    )
  }

  const completed = items.filter((i) => i.completed).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Typography variant="caption" className="font-semibold uppercase tracking-wider">
          Checklist
        </Typography>
        <Typography variant="caption" tone="muted">
          {completed}/{items.length} complete
        </Typography>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={readonly || !onToggle}
            onClick={() => onToggle?.(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 text-left text-sm transition-colors',
              item.completed && 'border-emerald-500/20 bg-emerald-500/5',
              !readonly && onToggle && 'hover:border-primary/30',
              readonly && 'cursor-default',
            )}
          >
            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                item.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background',
              )}
            >
              {item.completed && <Check className="size-3" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className={cn(item.completed && 'text-muted-foreground line-through')}>{item.label}</span>
              {item.completedBy && (
                <Typography variant="caption" tone="muted" className="block text-xs">
                  {item.completedBy} · {item.completedAt?.slice(0, 10)}
                </Typography>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
