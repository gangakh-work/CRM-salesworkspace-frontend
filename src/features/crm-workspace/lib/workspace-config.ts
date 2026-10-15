import type { WorkspaceTabId } from '@/features/crm-workspace/types/workspace.types'

/** Kanban column definitions per workspace tab (UI layout, not sample data). */
export const KANBAN_COLUMNS: Record<WorkspaceTabId, string[]> = {
  leads: ['New', 'Contacted', 'Qualified', 'Converted'],
  opportunities: ['Qualified', 'Proposal', 'Negotiation', 'Won'],
  workflows: ['To Do', 'In Progress', 'Review', 'Done'],
  activities: ['Today', 'Upcoming', 'Completed'],
  customers: ['Active', 'At Risk', 'Churned'],
  proposals: ['Draft', 'Review', 'Approved', 'Sent'],
  documents: ['Draft', 'Review', 'Approved'],
  tasks: ['To Do', 'In Progress', 'Done'],
}

export const WORKSPACE_TAB_IDS: WorkspaceTabId[] = [
  'leads',
  'opportunities',
  'workflows',
  'activities',
  'customers',
  'proposals',
  'documents',
  'tasks',
]

export function getTabFromPath(pathname: string): WorkspaceTabId {
  const match = pathname.match(/\/workspace\/(\w+)/)
  const tab = match?.[1] as WorkspaceTabId | undefined
  if (tab && WORKSPACE_TAB_IDS.includes(tab)) return tab
  return 'leads'
}

export const QUICK_ACTIONS = [
  { id: 'create-lead', label: 'Create Lead', href: '/workspace/leads' },
  { id: 'create-opportunity', label: 'Create Opportunity', href: '/workspace/opportunities' },
  { id: 'generate-proposal', label: 'Generate Proposal', href: '/workspace/proposals' },
  { id: 'schedule-meeting', label: 'Schedule Meeting', href: '/workspace/activities' },
  { id: 'email-customer', label: 'Email Customer', href: '/workspace/customers' },
  { id: 'upload-files', label: 'Upload Files', href: '/workspace/documents' },
]

export function formatRecordValue(value?: number): string {
  if (value === undefined) return '—'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}
