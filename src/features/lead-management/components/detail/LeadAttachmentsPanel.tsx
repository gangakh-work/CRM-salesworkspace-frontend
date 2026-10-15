import { Download, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { LeadAttachment } from '@/features/lead-management/types/lead.types'

export function LeadAttachmentsPanel({ attachments }: { attachments: LeadAttachment[] }) {
  if (!attachments.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No attachments yet.
      </Typography>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((file) => (
        <div key={file.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-primary" />
            <div>
              <Typography variant="body" className="text-sm font-medium">{file.name}</Typography>
              <Typography variant="caption" tone="muted">
                {file.size} · {file.uploadedBy} · {file.uploadedAt}
              </Typography>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Download">
            <Download className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
