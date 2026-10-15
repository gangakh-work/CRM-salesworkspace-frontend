import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import type { WorkflowApproval } from '@/features/workflow-engine/types/workflow.types'
import { cn } from '@/lib/utils'

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  readonly = false,
}: {
  approval: WorkflowApproval
  onApprove?: (comment?: string) => void
  onReject?: (comment?: string) => void
  readonly?: boolean
}) {
  const [comment, setComment] = useState('')
  const isPending = approval.status === 'pending'

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        isPending ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/60 bg-card/60',
        approval.status === 'approved' && 'border-emerald-500/30 bg-emerald-500/5',
        approval.status === 'rejected' && 'border-red-500/30 bg-red-500/5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Typography variant="body" className="text-sm font-semibold">{approval.stepName}</Typography>
          <Typography variant="caption" tone="muted">Approver: {approval.approver}</Typography>
        </div>
        <Badge
          variant={approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'warning'}
          className="capitalize"
        >
          {approval.status}
        </Badge>
      </div>

      {approval.comment && (
        <Typography variant="caption" className="mt-2 block rounded-lg bg-muted/50 p-2 italic">
          &ldquo;{approval.comment}&rdquo;
        </Typography>
      )}

      {approval.timestamp && (
        <Typography variant="caption" tone="muted" className="mt-2 block">
          {new Date(approval.timestamp).toLocaleString()}
        </Typography>
      )}

      {isPending && !readonly && onApprove && onReject && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add approval comment (optional)..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="gap-1" onClick={() => onApprove(comment || undefined)}>
              <Check className="size-3.5" />
              Approve
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => onReject(comment || undefined)}>
              <X className="size-3.5" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
