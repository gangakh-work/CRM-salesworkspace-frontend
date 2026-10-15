import { Check } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { STAGE_ORDER, formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import type { OpportunityStage } from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'

const STEPS = [...STAGE_ORDER]

export function OpportunityWorkflowStepper({ stage }: { stage: OpportunityStage }) {
  const currentIdx = stage === 'lost' ? -1 : STEPS.indexOf(stage as (typeof STEPS)[number])
  const isLost = stage === 'lost'

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-1">
        {STEPS.map((s, i) => {
          const done = currentIdx > i || stage === 'won'
          const active = s === stage
          const upcoming = currentIdx >= 0 && i > currentIdx && stage !== 'won'

          return (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  done && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  active && 'bg-primary text-primary-foreground',
                  upcoming && 'bg-muted text-muted-foreground',
                  isLost && 'opacity-50',
                )}
              >
                {done && <Check className="size-3" />}
                {formatStage(s)}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-px w-4 sm:w-8',
                    done ? 'bg-emerald-500/50' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
        {isLost && (
          <div className="ml-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
            Lost
          </div>
        )}
      </div>
      {isLost && (
        <Typography variant="caption" tone="muted" className="mt-2">
          This opportunity was marked as lost.
        </Typography>
      )}
    </div>
  )
}
