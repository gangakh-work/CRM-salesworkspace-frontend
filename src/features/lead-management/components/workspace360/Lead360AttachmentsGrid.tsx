import { motion } from 'framer-motion'
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image,
  Presentation,
  Upload,
} from 'lucide-react'
import { toast as sonnerToast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { LeadAttachment } from '@/features/lead-management/types/lead.types'
import { cn } from '@/lib/utils'

const TYPE_META = {
  pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
  doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  xlsx: { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  pptx: { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  image: { icon: Image, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  other: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
}

function inferType(name: string): LeadAttachment['type'] {
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'doc'
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx'
  if (name.endsWith('.pptx')) return 'pptx'
  if (/\.(png|jpg|jpeg|webp)$/i.test(name)) return 'image'
  return 'other'
}

export function Lead360AttachmentsGrid({ attachments }: { attachments: LeadAttachment[] }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => sonnerToast.info('Document upload will connect to Dataverse file storage')}
        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-8 transition-colors hover:border-primary/50 hover:bg-primary/10"
      >
        <Upload className="size-8 text-primary/60" />
        <Typography variant="body" className="mt-2 text-sm font-medium">Upload files</Typography>
        <Typography variant="caption" tone="muted">Drag & drop or click to browse</Typography>
      </button>

      {attachments.length === 0 ? (
        <Typography variant="caption" tone="muted" className="text-center">
          No attachments yet.
        </Typography>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {attachments.map((file, i) => {
            const type = file.type ?? inferType(file.name)
            const meta = TYPE_META[type ?? 'other']
            const Icon = meta.icon
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-border/60 bg-card/80 p-4 shadow-elevation-1 transition-all hover:border-primary/30 hover:shadow-elevation-2"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                    <Icon className={cn('size-5', meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography variant="body" className="truncate text-sm font-semibold">{file.name}</Typography>
                    <Typography variant="caption" tone="muted">{file.size}</Typography>
                    <Typography variant="caption" className="mt-1 block text-xs text-muted-foreground">
                      {file.uploadedBy} · {file.uploadedAt}
                    </Typography>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 gap-1 text-xs"
                    onClick={() => sonnerToast.info(`Preview: ${file.name}`)}
                  >
                    <Eye className="size-3.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 gap-1 text-xs"
                    onClick={() => sonnerToast.success(`Download started: ${file.name}`)}
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
