import type { LucideIcon } from 'lucide-react'

export type DashboardWidgetId =
  | 'kpis'
  | 'ai-insights'
  | 'quick-actions'
  | 'activities'
  | 'meetings'
  | 'pipeline'
  | 'notifications'

export type KpiStatus = 'success' | 'warning' | 'error' | 'neutral'

export interface KpiMetric {
  id: string
  title: string
  value: number
  format: 'currency' | 'number' | 'percent'
  trend: number
  trendLabel: string
  status: KpiStatus
  sparkline?: number[]
  icon: LucideIcon
}

export interface AiInsight {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
  actionLabel: string
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  href: string
  accent: string
}

export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'lead' | 'opportunity' | 'proposal' | 'meeting' | 'email'
  icon: LucideIcon
}

export interface MeetingItem {
  id: string
  title: string
  customer: string
  time: string
  duration: string
  status: 'confirmed' | 'tentative' | 'upcoming'
  type: 'video' | 'in-person' | 'phone'
}

export interface PipelineStage {
  id: string
  label: string
  count: number
  value: number
  color: string
}

export interface DashboardNotification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface DashboardSettings {
  widgetOrder: DashboardWidgetId[]
  collapsedSections: Partial<Record<DashboardWidgetId, boolean>>
}

export const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  'kpis',
  'ai-insights',
  'quick-actions',
  'activities',
  'meetings',
  'pipeline',
  'notifications',
]

export const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  kpis: 'KPI Metrics',
  'ai-insights': 'AI Insights',
  'quick-actions': 'Quick Actions',
  activities: 'Recent Activities',
  meetings: 'Upcoming Meetings',
  pipeline: 'Sales Pipeline',
  notifications: 'Notifications',
}
