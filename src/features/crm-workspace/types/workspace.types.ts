import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  FolderOpen,
  GitBranch,
  ListTodo,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'

export type WorkspaceTabId =
  | 'leads'
  | 'opportunities'
  | 'workflows'
  | 'activities'
  | 'customers'
  | 'proposals'
  | 'documents'
  | 'tasks'

export type ViewMode = 'cards' | 'list' | 'kanban' | 'table' | 'calendar' | 'timeline'

export type RecordStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'open'
  | 'in-progress'
  | 'completed'
  | 'pending'
  | 'draft'
  | 'review'
  | 'approved'

export interface WorkspaceTab {
  id: WorkspaceTabId
  label: string
  icon: LucideIcon
  path: string
  description: string
}

export interface WorkspaceRecord {
  id: string
  title: string
  subtitle: string
  status: RecordStatus | string
  value?: number
  owner: string
  date: string
  dueDate?: string
  priority?: 'high' | 'medium' | 'low'
  tags?: string[]
  kanbanColumn?: string
  email?: string
  phone?: string
  company?: string
}

export interface AiSuggestion {
  id: string
  label: string
  description: string
}

export interface AiFollowUp {
  id: string
  title: string
  due: string
  priority: 'high' | 'medium' | 'low'
}

export interface AiRiskAlert {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
}

export interface WorkspaceFilter {
  id: string
  label: string
}

export const WORKSPACE_TABS: WorkspaceTab[] = [
  {
    id: 'leads',
    label: 'Leads',
    icon: Target,
    path: '/workspace/leads',
    description: 'Prospects and inbound inquiries',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: TrendingUp,
    path: '/workspace/opportunities',
    description: 'Active deals in your pipeline',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: GitBranch,
    path: '/workspace/workflows',
    description: 'Sales process automation and approvals',
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: ListTodo,
    path: '/workspace/activities',
    description: 'Calls, meetings, and follow-ups',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/workspace/customers',
    description: 'Accounts and customer relationships',
  },
  {
    id: 'proposals',
    label: 'Proposals',
    icon: FileText,
    path: '/workspace/proposals',
    description: 'Quotes and proposal documents',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    path: '/workspace/documents',
    description: 'Files and shared resources',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ListTodo,
    path: '/workspace/tasks',
    description: 'Action items and to-dos',
  },
]

export const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'table', label: 'Table' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'timeline', label: 'Timeline' },
]

export const QUICK_FILTERS: WorkspaceFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'My records' },
  { id: 'today', label: 'Due today' },
  { id: 'high-priority', label: 'High priority' },
  { id: 'recent', label: 'Recent' },
]
