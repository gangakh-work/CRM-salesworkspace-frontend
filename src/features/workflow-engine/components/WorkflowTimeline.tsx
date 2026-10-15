import { motion } from 'framer-motion'

import { Typography } from '@/components/ui/typography'
import type { AuditEntry } from '@/features/workflow-engine/types/workflow.types'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  MessageSquare,
  Play,
  RefreshCw,
  Shield,
  Undo2,
  Bell,
} from 'lucide-react'

const ACTION_ICONS: Record<string, typeof Play> = {
  'Workflow Started': Play,
  'Step Completed': CheckCircle2,
  'Approval Granted': Shield,
  'Comment Added': MessageSquare,
  default: RefreshCw,
}

export function WorkflowTimeline({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) {
    return (
      <Typography variant="caption" tone="muted" className="py-8 text-center">
        No audit history yet.
      </Typography>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative pl-2">
      <div className="absolute bottom-3 left-[1.125rem] top-3 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
      <div className="space-y-1">
        {entries.map((entry, index) => {
          const Icon = ACTION_ICONS[entry.action] ?? ACTION_ICONS.default
          return (
            <motion.div key={entry.id} variants={fadeIn} custom={index} className="relative flex gap-4 pb-5">
              <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/10 shadow-sm">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-card/50 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Typography variant="body" className="text-sm font-semibold">{entry.action}</Typography>
                  <Typography variant="caption" tone="muted" className="shrink-0 text-xs">
                    {new Date(entry.timestamp).toLocaleString()}
                  </Typography>
                </div>
                {entry.details && (
                  <Typography variant="caption" tone="muted" className="mt-1 block">{entry.details}</Typography>
                )}
                <Typography variant="caption" className={cn('mt-2 text-xs text-muted-foreground/70')}>
                  {entry.actor}
                </Typography>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function WorkflowActivityFeed({
  activities,
}: {
  activities: { id: string; type: string; title: string; description: string; actor: string; timestamp: string }[]
}) {
  const typeIcon = (type: string) => {
    switch (type) {
      case 'approval': return Shield
      case 'comment': return MessageSquare
      case 'step_completed': return CheckCircle2
      case 'undo': return Undo2
      case 'notification': return Bell
      default: return Play
    }
  }

  return (
    <div className="space-y-2">
      {activities.map((act) => {
        const Icon = typeIcon(act.type)
        return (
          <div key={act.id} className="flex gap-3 rounded-lg border border-border/40 bg-card/40 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="body" className="text-sm font-medium">{act.title}</Typography>
              <Typography variant="caption" tone="muted">{act.description}</Typography>
              <Typography variant="caption" className="mt-1 block text-xs text-muted-foreground/70">
                {act.actor} · {new Date(act.timestamp).toLocaleString()}
              </Typography>
            </div>
          </div>
        )
      })}
    </div>
  )
}
