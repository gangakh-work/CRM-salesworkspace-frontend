import type { WorkflowInstance } from '@/features/workflow-engine/types/workflow.types'

/** Default owner options when CRM filter API is unavailable. */
export const WORKFLOW_OWNERS_FALLBACK = ['Vinay Kumar', 'James Wilson', 'Sarah Chen', 'Emily Park']

/** @deprecated Use live CRM owners via useCrmFilterOptions when available. */
export const WORKFLOW_OWNERS = WORKFLOW_OWNERS_FALLBACK

export function getWorkflowStats(workflows: WorkflowInstance[]) {
  return {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    completed: workflows.filter((w) => w.status === 'completed').length,
    awaitingApproval: workflows.filter((w) =>
      w.approvals.some((a) => a.status === 'pending'),
    ).length,
    avgProgress: workflows.length
      ? Math.round(workflows.reduce((sum, workflow) => sum + workflow.progress, 0) / workflows.length)
      : 0,
  }
}
