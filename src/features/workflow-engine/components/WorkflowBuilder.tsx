import { motion } from 'framer-motion'
import { GitBranch, Play, Shield, ListChecks, Bell, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { REUSABLE_ACTIONS, getAction } from '@/features/workflow-engine/lib/workflow-definitions'
import type { WorkflowTemplate } from '@/features/workflow-engine/types/workflow.types'
import { DecisionNode } from '@/features/workflow-engine/components/WorkflowStepper'
import { ProgressIndicator } from '@/features/workflow-engine/components/ProgressIndicator'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const STEP_TYPE_CONFIG = {
  action: { icon: Play, color: 'border-blue-500/30 bg-blue-500/5', label: 'Action' },
  approval: { icon: Shield, color: 'border-amber-500/30 bg-amber-500/5', label: 'Approval' },
  decision: { icon: GitBranch, color: 'border-violet-500/30 bg-violet-500/5', label: 'Decision' },
  notification: { icon: Bell, color: 'border-teal-500/30 bg-teal-500/5', label: 'Notification' },
  checklist: { icon: ListChecks, color: 'border-indigo-500/30 bg-indigo-500/5', label: 'Checklist' },
}

export function WorkflowBuilder({ template }: { template: WorkflowTemplate }) {
  const templateActions = template.reusableActions
    .map((id) => getAction(id))
    .filter(Boolean)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-primary/5 p-5">
        <Typography variant="heading-m">{template.name}</Typography>
        <Typography variant="caption" tone="muted" className="mt-1">{template.description}</Typography>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{template.category}</Badge>
          <Badge variant="outline">{template.steps.length} steps</Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <Typography variant="body" className="mb-3 text-sm font-semibold">Template Progress Preview</Typography>
        <ProgressIndicator value={0} size="lg" />
        <Typography variant="caption" tone="muted" className="mt-2 block">
          Visual stepper shows step sequence when workflow is running
        </Typography>
      </div>

      <div className="space-y-4">
        <Typography variant="body" className="text-sm font-semibold uppercase tracking-wider">
          Workflow Steps
        </Typography>
        {template.steps.map((step, i) => {
          const config = STEP_TYPE_CONFIG[step.type]
          const Icon = config.icon
          return (
            <motion.div key={step.id} variants={fadeIn}>
              <div className={cn('rounded-xl border p-4', config.color)}>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Step {i + 1}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                      {step.optional && <Badge variant="neutral" className="text-[10px]">Optional</Badge>}
                    </div>
                    <Typography variant="body" className="mt-1 font-semibold">{step.name}</Typography>
                    <Typography variant="caption" tone="muted">{step.description}</Typography>
                    {step.ownerRole && (
                      <Typography variant="caption" className="mt-1 block">Owner role: {step.ownerRole}</Typography>
                    )}

                    {step.conditions && step.conditions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.conditions.map((c) => (
                          <Badge key={c.id} variant="outline" className="text-[10px]">
                            {c.label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {step.actions && step.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.actions.map((actionId) => {
                          const action = getAction(actionId)
                          return action ? (
                            <Badge key={actionId} variant="info" className="gap-1 text-[10px]">
                              <Zap className="size-2.5" />
                              {action.label}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}

                    {step.approvers && (
                      <Typography variant="caption" tone="muted" className="mt-2 block">
                        Approvers: {step.approvers.join(', ')}
                        {step.requiredApprovals && ` (${step.requiredApprovals} required)`}
                      </Typography>
                    )}

                    {step.checklistItems && (
                      <ul className="mt-2 space-y-1">
                        {step.checklistItems.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ListChecks className="size-3" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {step.decisionBranches && step.decisionBranches.length > 0 && (
                  <div className="mt-4">
                    <DecisionNode
                      branches={step.decisionBranches.map((b) => ({
                        id: b.id,
                        label: b.label,
                        condition: b.condition ? { label: b.condition.label } : undefined,
                      }))}
                    />
                  </div>
                )}
              </div>
              {i < template.steps.length - 1 && (
                <div className="ml-5 h-4 w-px bg-border" />
              )}
            </motion.div>
          )
        })}
      </div>

      {templateActions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <Typography variant="body" className="mb-3 text-sm font-semibold">Reusable Actions</Typography>
          <div className="flex flex-wrap gap-2">
            {templateActions.map((action) => (
              <Badge key={action!.id} variant="outline" className="gap-1">
                <Zap className="size-3" />
                {action!.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
        <Typography variant="body" className="mb-2 text-sm font-semibold">All Available Reusable Actions</Typography>
        <div className="flex flex-wrap gap-1.5">
          {REUSABLE_ACTIONS.map((action) => (
            <Badge key={action.id} variant="secondary" className="text-[10px] font-normal">
              {action.label}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
