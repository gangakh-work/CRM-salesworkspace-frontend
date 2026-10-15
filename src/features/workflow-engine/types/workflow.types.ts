export type WorkflowTemplateId =
  | 'lead_creation'
  | 'lead_qualification'
  | 'opportunity_creation'
  | 'proposal_review'
  | 'proposal_approval'
  | 'commercial_review'
  | 'won_process'
  | 'lost_process'
  | 'customer_follow_up'
  | 'meeting_preparation'

export type WorkflowCategory =
  | 'lead'
  | 'opportunity'
  | 'proposal'
  | 'commercial'
  | 'customer'
  | 'meeting'

export type WorkflowInstanceStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'blocked'
  | 'awaiting_approval'

export type StepType = 'action' | 'approval' | 'decision' | 'notification' | 'checklist'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type NotificationType = 'info' | 'approval' | 'warning' | 'success'

export type FutureIntegration =
  | 'power_automate'
  | 'dataverse'
  | 'azure_openai'
  | 'teams'
  | 'outlook'

export interface WorkflowCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'contains'
  value: string | number | boolean
  label: string
}

export interface WorkflowAction {
  id: string
  label: string
  icon?: string
  reusable: boolean
}

export interface DecisionBranch {
  id: string
  label: string
  condition?: WorkflowCondition
  nextStepId: string
}

export interface WorkflowStepDefinition {
  id: string
  name: string
  description: string
  type: StepType
  ownerRole?: string
  requiredApprovals?: number
  approvers?: string[]
  conditions?: WorkflowCondition[]
  actions?: string[]
  checklistItems?: string[]
  decisionBranches?: DecisionBranch[]
  optional?: boolean
}

export interface WorkflowTemplate {
  id: WorkflowTemplateId
  name: string
  description: string
  category: WorkflowCategory
  steps: WorkflowStepDefinition[]
  reusableActions: string[]
}

export interface WorkflowStepInstance {
  id: string
  definitionId: string
  name: string
  type: StepType
  status: StepStatus
  owner: string
  order: number
  startedAt?: string
  completedAt?: string
}

export interface WorkflowApproval {
  id: string
  stepId: string
  stepName: string
  approver: string
  status: ApprovalStatus
  comment?: string
  timestamp?: string
}

export interface WorkflowComment {
  id: string
  author: string
  content: string
  timestamp: string
  stepId?: string
}

export interface WorkflowNotification {
  id: string
  title: string
  message: string
  read: boolean
  timestamp: string
  type: NotificationType
  workflowId: string
}

export interface AuditEntry {
  id: string
  action: string
  actor: string
  timestamp: string
  details?: string
  stepId?: string
}

export interface WorkflowChecklistItem {
  id: string
  stepId: string
  label: string
  completed: boolean
  completedBy?: string
  completedAt?: string
}

export interface WorkflowActivity {
  id: string
  type: 'step_started' | 'step_completed' | 'approval' | 'comment' | 'notification' | 'undo'
  title: string
  description: string
  actor: string
  timestamp: string
  stepId?: string
}

export interface WorkflowInstance {
  id: string
  templateId: WorkflowTemplateId
  name: string
  status: WorkflowInstanceStatus
  owner: string
  entityType?: 'lead' | 'opportunity' | 'customer' | 'proposal'
  entityId?: string
  entityName?: string
  currentStepId: string
  progress: number
  steps: WorkflowStepInstance[]
  approvals: WorkflowApproval[]
  comments: WorkflowComment[]
  notifications: WorkflowNotification[]
  auditHistory: AuditEntry[]
  checklist: WorkflowChecklistItem[]
  activities: WorkflowActivity[]
  startedAt: string
  updatedAt: string
  completedAt?: string
}

export type { ConfirmDialogState } from '@/types/confirm-dialog.types'

export interface WorkflowFilters {
  status: WorkflowInstanceStatus[]
  template: WorkflowTemplateId[]
  owner: string[]
  category: WorkflowCategory[]
}

export const DEFAULT_WORKFLOW_FILTERS: WorkflowFilters = {
  status: [],
  template: [],
  owner: [],
  category: [],
}
