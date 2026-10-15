import { Check } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { WORKFLOW_ORDER, formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import type { LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'
import { cn } from '@/lib/utils'

export function LeadWorkflowStepper({ status }: { status: LeadWorkflowStatus }) {
  const isDisqualified = status === 'disqualified'
  const currentIndex = WORKFLOW_ORDER.indexOf(status === 'converted' ? 'converted' : status)

  return (
    <div className="space-y-2">
      {isDisqualified && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <Typography variant="caption" className="font-medium text-destructive">
            This lead has been disqualified and is no longer in the active pipeline.
          </Typography>
        </div>
      )}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {WORKFLOW_ORDER.map((step, index) => {
          const done = !isDisqualified && (status === 'converted' ? index <= currentIndex : index < currentIndex)
          const active = !isDisqualified && step === status
          const upcoming = !done && !active

          return (
            <div key={step} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    done && 'border-emerald-500 bg-emerald-500 text-white',
                    active && 'border-primary bg-primary text-primary-foreground',
                    upcoming && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                    isDisqualified && 'opacity-40',
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </div>
                <Typography
                  variant="caption"
                  className={cn(
                    'max-w-[4.5rem] truncate text-center text-[10px]',
                    active ? 'font-semibold text-primary' : 'text-muted-foreground',
                  )}
                >
                  {formatWorkflowStatus(step).replace(' to Opportunity', '')}
                </Typography>
              </div>
              {index < WORKFLOW_ORDER.length - 1 && (
                <div
                  className={cn(
                    'mx-0.5 h-0.5 flex-1 rounded',
                    done ? 'bg-emerald-500' : 'bg-muted-foreground/20',
                    isDisqualified && 'opacity-40',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
