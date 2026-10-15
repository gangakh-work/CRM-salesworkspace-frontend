import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bot,
  Building2,
  Contact,
  FileText,
  FolderOpen,
  Gauge,
  LineChart,
  MessagesSquare,
  Plug,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'

export interface FeatureDefinition {
  id: string
  label: string
  description: string
  path: string
  icon: LucideIcon
  enabled: boolean
  group: 'core' | 'sales' | 'intelligence' | 'tools' | 'admin'
  showInNav: boolean
  badge?: string
}

export const featureRegistry: Record<string, FeatureDefinition> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Sales command center and KPI overview',
    path: '/dashboard',
    icon: LayoutDashboard,
    enabled: true,
    group: 'core',
    showInNav: true,
  },
  workflow: {
    id: 'workflow',
    label: 'My Workflow',
    description: 'Your ranked, explained daily action queue',
    path: '/workflow',
    icon: ListTodo,
    enabled: true,
    group: 'core',
    showInNav: true,
  },
  leads: {
    id: 'leads',
    label: 'Leads',
    description: 'Lead management and pipeline intake',
    path: '/workspace/leads',
    icon: Target,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  accounts: {
    id: 'accounts',
    label: 'Accounts',
    description: 'Companies with contacts, deals, leads and activity',
    path: '/accounts',
    icon: Building2,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  contacts: {
    id: 'contacts',
    label: 'Contacts',
    description: 'People with their account, deals and activity',
    path: '/contacts',
    icon: Contact,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  opportunities: {
    id: 'opportunities',
    label: 'Opportunities',
    description: 'Opportunity tracking and pipeline management',
    path: '/workspace/opportunities',
    icon: TrendingUp,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  workflows: {
    id: 'workflows',
    label: 'Workflows',
    description: 'Sales process automation and workflow engine',
    path: '/workspace/workflows',
    icon: GitBranch,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  activities: {
    id: 'activities',
    label: 'Activities',
    description: 'Tasks, calls, meetings, and follow-ups',
    path: '/workspace/activities',
    icon: ListTodo,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  documents: {
    id: 'documents',
    label: 'Documents',
    description: 'Document management and SharePoint integration',
    path: '/workspace/documents',
    icon: FolderOpen,
    enabled: true,
    group: 'sales',
    showInNav: true,
  },
  dealIntelligence: {
    id: 'dealIntelligence',
    label: 'Deal Intelligence',
    description: 'Explainable deal risks with evidence',
    path: '/intelligence/deals',
    icon: Gauge,
    enabled: true,
    group: 'intelligence',
    showInNav: true,
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics & Forecast',
    description: 'Pipeline, win rate, cycle time and weighted forecast',
    path: '/intelligence/analytics',
    icon: LineChart,
    enabled: true,
    group: 'intelligence',
    showInNav: true,
  },
  conversations: {
    id: 'conversations',
    label: 'Conversation Insights',
    description: 'Needs a recording/transcript source',
    path: '/intelligence/conversations',
    icon: MessagesSquare,
    enabled: true,
    group: 'intelligence',
    showInNav: true,
    badge: 'Off',
  },
  reports: {
    id: 'reports',
    label: 'Reports',
    description: 'Analytics, dashboards, and Power BI embeds',
    path: '/reports',
    icon: BarChart3,
    enabled: true,
    group: 'intelligence',
    showInNav: true,
  },
  salesAgent: {
    id: 'salesAgent',
    label: 'AI Sales Agent',
    description: 'Autonomous prospecting, follow-ups and meeting booking',
    path: '/sales-agent',
    icon: Sparkles,
    enabled: true,
    group: 'sales',
    showInNav: true,
    badge: 'Agent',
  },
  aiAssistant: {
    id: 'aiAssistant',
    label: 'AI Assistant',
    description: 'Copilot for sales workflows and insights',
    path: '/ai-assistant',
    icon: Bot,
    enabled: true,
    group: 'core',
    showInNav: true,
    badge: 'AI',
  },
  proposalEvaluator: {
    id: 'proposalEvaluator',
    label: 'Proposal Evaluator',
    description: 'AI-powered proposal review and scoring',
    path: '/proposal-evaluator',
    icon: FileText,
    enabled: false,
    group: 'tools',
    showInNav: false,
  },
  kmPortal: {
    id: 'kmPortal',
    label: 'KM Portal',
    description: 'Knowledge management and document search',
    path: '/km-portal',
    icon: FolderOpen,
    enabled: false,
    group: 'tools',
    showInNav: false,
  },
  commercialChecker: {
    id: 'commercialChecker',
    label: 'Commercial Checker',
    description: 'Commercial compliance and pricing validation',
    path: '/commercial-checker',
    icon: Shield,
    enabled: false,
    group: 'tools',
    showInNav: false,
  },
  commissionAgent: {
    id: 'commissionAgent',
    label: 'Commission Agent',
    description: 'Commission calculation and forecasting',
    path: '/commission-agent',
    icon: BarChart3,
    enabled: false,
    group: 'tools',
    showInNav: false,
  },
  integrations: {
    id: 'integrations',
    label: 'Integrations & Audit',
    description: 'Connection health and audit log',
    path: '/integrations',
    icon: Plug,
    enabled: true,
    group: 'admin',
    showInNav: true,
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    description: 'Application preferences and configuration',
    path: '/settings',
    icon: Settings,
    enabled: true,
    group: 'admin',
    showInNav: true,
  },
  administration: {
    id: 'administration',
    label: 'Administration',
    description: 'User management, roles, and system settings',
    path: '/administration',
    icon: Shield,
    enabled: true,
    group: 'admin',
    showInNav: true,
  },
}

export function getEnabledFeatures(): FeatureDefinition[] {
  return Object.values(featureRegistry).filter((f) => f.enabled)
}

export function getNavFeatures(): FeatureDefinition[] {
  return getEnabledFeatures().filter((f) => f.showInNav)
}

export function getFeatureById(id: string): FeatureDefinition | undefined {
  return featureRegistry[id]
}

export function getFeatureByPath(path: string): FeatureDefinition | undefined {
  return Object.values(featureRegistry).find(
    (f) => f.path === path || path.startsWith(`${f.path}/`),
  )
}

export function isFeatureEnabled(id: string): boolean {
  return featureRegistry[id]?.enabled ?? false
}
