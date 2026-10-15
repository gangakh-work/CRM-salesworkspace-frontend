import type { LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'

export const WORKFLOW_ORDER: LeadWorkflowStatus[] = [
  'draft',
  'assigned',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'converted',
]

export const WORKFLOW_LABELS: Record<LeadWorkflowStatus, string> = {
  draft: 'Draft',
  assigned: 'Assigned',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  converted: 'Converted to Opportunity',
  disqualified: 'Disqualified',
}

export const WORKFLOW_TRANSITIONS: Record<LeadWorkflowStatus, LeadWorkflowStatus[]> = {
  draft: ['assigned', 'disqualified'],
  assigned: ['contacted', 'disqualified'],
  contacted: ['qualified', 'disqualified'],
  qualified: ['proposal_sent', 'disqualified'],
  proposal_sent: ['negotiation', 'disqualified'],
  negotiation: ['converted', 'disqualified'],
  converted: [],
  disqualified: [],
}

export function workflowToKanban(status: LeadWorkflowStatus): string {
  return WORKFLOW_LABELS[status]
}

export function canTransition(from: LeadWorkflowStatus, to: LeadWorkflowStatus): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextStatuses(status: LeadWorkflowStatus): LeadWorkflowStatus[] {
  return WORKFLOW_TRANSITIONS[status] ?? []
}

export function isTerminalStatus(status: LeadWorkflowStatus): boolean {
  return status === 'converted' || status === 'disqualified'
}

export function formatWorkflowStatus(status: LeadWorkflowStatus): string {
  return WORKFLOW_LABELS[status]
}

/** Map legacy mock statuses to workflow statuses */
export function migrateLegacyStatus(status: string): LeadWorkflowStatus {
  const map: Record<string, LeadWorkflowStatus> = {
    new: 'draft',
    contacted: 'contacted',
    qualified: 'qualified',
    unqualified: 'disqualified',
    converted: 'converted',
    draft: 'draft',
    assigned: 'assigned',
    proposal_sent: 'proposal_sent',
    negotiation: 'negotiation',
    disqualified: 'disqualified',
  }
  return map[status] ?? 'draft'
}
