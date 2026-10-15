import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import type { WorkflowComment } from '@/features/workflow-engine/types/workflow.types'

export function WorkflowComments({
  comments,
  onAdd,
  readonly = false,
}: {
  comments: WorkflowComment[]
  onAdd?: (content: string) => void
  readonly?: boolean
}) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim() || !onAdd) return
    onAdd(draft)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      {!readonly && onAdd && (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <Button variant="primary" size="sm" onClick={submit} disabled={!draft.trim()}>
            Post Comment
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <Typography variant="body" className="text-sm font-semibold">{c.author}</Typography>
              <Typography variant="caption" tone="muted">{new Date(c.timestamp).toLocaleString()}</Typography>
            </div>
            <Typography variant="body" className="mt-1 text-sm">{c.content}</Typography>
          </div>
        ))}
        {!comments.length && (
          <Typography variant="caption" tone="muted" className="py-6 text-center">
            No comments yet.
          </Typography>
        )}
      </div>
    </div>
  )
}
