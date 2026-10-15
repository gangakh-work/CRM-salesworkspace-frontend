import type {
  WorkflowInstance,
  WorkflowStepDefinition,
  WorkflowStepInstance,
  WorkflowTemplate,
} from '@/features/workflow-engine/types/workflow.types'

export function computeProgress(steps: WorkflowStepInstance[]): number {
  if (!steps.length) return 0
  const completed = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length
  return Math.round((completed / steps.length) * 100)
}

export function getCurrentStep(
  instance: WorkflowInstance,
): WorkflowStepInstance | undefined {
  return instance.steps.find((s) => s.id === instance.currentStepId)
}

export function getStepIndex(steps: WorkflowStepInstance[], stepId: string): number {
  return steps.findIndex((s) => s.id === stepId)
}

export function canCompleteStep(step: WorkflowStepInstance): boolean {
  return step.status === 'in_progress' || step.status === 'awaiting_approval'
}

export function canStartStep(step: WorkflowStepInstance, steps: WorkflowStepInstance[]): boolean {
  if (step.status !== 'pending') return false
  const idx = getStepIndex(steps, step.id)
  if (idx === 0) return true
  const prev = steps[idx - 1]
  return prev?.status === 'completed' || prev?.status === 'skipped'
}

export function instantiateSteps(
  template: WorkflowTemplate,
  owner: string,
  prefix: string,
): WorkflowStepInstance[] {
  return template.steps.map((def, i) => ({
    id: `${prefix}-step-${def.id}`,
    definitionId: def.id,
    name: def.name,
    type: def.type,
    status: i === 0 ? 'in_progress' : 'pending',
    owner: def.ownerRole === 'System' ? 'System' : owner,
    order: i,
    startedAt: i === 0 ? new Date().toISOString() : undefined,
  }))
}

export function buildChecklistFromTemplate(
  template: WorkflowTemplate,
  stepInstances: WorkflowStepInstance[],
  prefix: string,
) {
  const items: { id: string; stepId: string; label: string; completed: boolean }[] = []
  template.steps.forEach((def) => {
    if (!def.checklistItems?.length) return
    const stepInst = stepInstances.find((s) => s.definitionId === def.id)
    if (!stepInst) return
    def.checklistItems.forEach((label, i) => {
      items.push({
        id: `${prefix}-chk-${def.id}-${i}`,
        stepId: stepInst.id,
        label,
        completed: false,
      })
    })
  })
  return items
}

export function getPendingApprovals(
  instance: WorkflowInstance,
  stepDef?: WorkflowStepDefinition,
): boolean {
  if (!stepDef?.requiredApprovals) return false
  const stepApprovals = instance.approvals.filter(
    (a) => a.stepId === instance.currentStepId && a.status === 'approved',
  )
  return stepApprovals.length < (stepDef.requiredApprovals ?? 1)
}

export function formatWorkflowStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatStepStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const STATUS_VARIANT: Record<string, 'success' | 'error' | 'info' | 'warning' | 'secondary' | 'neutral'> = {
  draft: 'neutral',
  active: 'info',
  paused: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  failed: 'error',
  pending: 'neutral',
  in_progress: 'info',
  completed_step: 'success',
  skipped: 'secondary',
  blocked: 'error',
  awaiting_approval: 'warning',
}

export const CATEGORY_COLORS: Record<string, string> = {
  lead: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  opportunity: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  proposal: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  commercial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  customer: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  meeting: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
}
