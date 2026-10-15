import { Check, GitBranch, Shield, ListChecks, Bell, Play } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { formatStepStatus } from '@/features/workflow-engine/lib/workflow-engine'
import type { WorkflowStepDefinition, WorkflowStepInstance } from '@/features/workflow-engine/types/workflow.types'
import { cn } from '@/lib/utils'

const TYPE_ICONS = {
  action: Play,
  approval: Shield,
  decision: GitBranch,
  notification: Bell,
  checklist: ListChecks,
}

export function WorkflowStepper({
  steps,
  stepDefinitions,
  currentStepId,
  orientation = 'horizontal',
}: {
  steps: WorkflowStepInstance[]
  stepDefinitions?: WorkflowStepDefinition[]
  currentStepId?: string
  orientation?: 'horizontal' | 'vertical'
}) {
  const getDef = (defId: string) => stepDefinitions?.find((d) => d.id === defId)

  if (orientation === 'vertical') {
    return (
      <div className="space-y-0">
        {steps.map((step, i) => {
          const def = getDef(step.definitionId)
          const Icon = TYPE_ICONS[step.type]
          const isCurrent = step.id === currentStepId
          const isDone = step.status === 'completed' || step.status === 'skipped'

          return (
            <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && (
                <div className={cn('absolute left-[1.125rem] top-9 h-[calc(100%-1.5rem)] w-px', isDone ? 'bg-emerald-500/50' : 'bg-border')} />
              )}
              <div
                className={cn(
                  'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isDone && 'border-emerald-500 bg-emerald-500 text-white',
                  isCurrent && !isDone && 'border-primary bg-primary text-primary-foreground',
                  !isDone && !isCurrent && 'border-border bg-background text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <Typography variant="body" className={cn('text-sm font-semibold', isCurrent && 'text-primary')}>
                  {step.name}
                </Typography>
                {def?.description && (
                  <Typography variant="caption" tone="muted" className="mt-0.5 block">{def.description}</Typography>
                )}
                <Typography variant="caption" className="mt-1 capitalize text-xs text-muted-foreground">
                  {formatStepStatus(step.status)} · {step.owner}
                </Typography>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-1">
        {steps.map((step, i) => {
          const isCurrent = step.id === currentStepId
          const isDone = step.status === 'completed' || step.status === 'skipped'
          const Icon = TYPE_ICONS[step.type]

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  isDone && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  isCurrent && !isDone && 'bg-primary text-primary-foreground shadow-sm',
                  !isDone && !isCurrent && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-3" /> : step.status === 'awaiting_approval' ? <Shield className="size-3" /> : <Icon className="size-3" />}
                <span className="max-w-[8rem] truncate">{step.name}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('mx-1 h-px w-4 sm:w-6', isDone ? 'bg-emerald-500/50' : 'bg-border')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DecisionNode({
  branches,
}: {
  branches: { id: string; label: string; condition?: { label: string } }[]
}) {
  return (
    <div className="relative rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="size-4 text-violet-600" />
        <Typography variant="caption" className="font-semibold uppercase tracking-wider text-violet-600">
          Decision Node
        </Typography>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-lg border border-violet-500/20 bg-background/80 px-3 py-2">
            <Typography variant="body" className="text-sm font-medium">{branch.label}</Typography>
            {branch.condition && (
              <Typography variant="caption" tone="muted" className="mt-0.5 block text-xs">
                If: {branch.condition.label}
              </Typography>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
