import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'

export function OpportunityNotesPanel({
  oppId,
  notes,
}: {
  oppId: string
  notes: { id: string; content: string; author: string; createdAt: string }[]
}) {
  const { addNote } = useOpportunityManagement()
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim()) return
    addNote(oppId, draft)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this opportunity..."
          rows={3}
        />
        <Button variant="primary" size="sm" onClick={submit} disabled={!draft.trim()}>
          Add Note
        </Button>
      </div>
      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
            <Typography variant="body" className="text-sm">{note.content}</Typography>
            <Typography variant="caption" tone="muted" className="mt-2 block">
              {note.author} · {note.createdAt}
            </Typography>
          </div>
        ))}
        {!notes.length && (
          <Typography variant="caption" tone="muted" className="py-8 text-center">
            No notes yet.
          </Typography>
        )}
      </div>
    </div>
  )
}
