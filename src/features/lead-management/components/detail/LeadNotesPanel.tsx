import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import type { LeadNote } from '@/features/lead-management/types/lead.types'

export function LeadNotesPanel({ leadId, notes }: { leadId: string; notes: LeadNote[] }) {
  const { addNote } = useLeadManagement()
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim()) return
    addNote(leadId, draft)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this lead..."
          rows={3}
        />
        <Button variant="primary" size="sm" onClick={submit} disabled={!draft.trim()}>
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Typography variant="caption" tone="muted">No notes yet.</Typography>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-muted/20 p-3">
              <Typography variant="body" className="text-sm leading-relaxed">{note.content}</Typography>
              <Typography variant="caption" tone="muted" className="mt-2 block">
                {note.author} · {new Date(note.createdAt).toLocaleDateString()}
              </Typography>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
