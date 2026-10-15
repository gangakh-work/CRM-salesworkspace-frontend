import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'

import { DashboardChartsGrid } from '@/features/dashboard/components/DashboardChartsGrid'
import { DashboardRefreshIndicator } from '@/features/dashboard/components/DashboardRefreshIndicator'
import { DashboardSection } from '@/features/dashboard/components/DashboardSection'
import { DashboardTablesGrid } from '@/features/dashboard/components/DashboardTablesGrid'
import { DisqualificationReportPanel } from '@/features/dashboard/components/DisqualificationReportPanel'
import { ExecutiveDashboardPanel } from '@/features/dashboard/components/ExecutiveDashboardPanel'
import { KpiMetricsGrid } from '@/features/dashboard/components/KpiMetricsGrid'
import { LeadFunnelPanel } from '@/features/dashboard/components/LeadFunnelPanel'
import { LeadScoreDistributionPanel } from '@/features/dashboard/components/LeadScoreDistributionPanel'
import { MyDayPanel } from '@/features/dashboard/components/MyDayPanel'
import { RecentActivitiesPanel } from '@/features/dashboard/components/RecentActivitiesPanel'
import { pageTransition } from '@/design-system/animations/motion'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

const SECTIONS_STORAGE_KEY = 'sw:dashboard-open-sections'

function loadOpenSections(): Set<string> {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore */
  }
  // Progressive disclosure: analytics start collapsed so "My Day" leads.
  return new Set()
}

export function DashboardPage() {
  const { settings } = useSettings()
  const [openSections, setOpenSections] = useState<Set<string>>(loadOpenSections)

  const toggle = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const sectionProps = (id: string) => ({
    id,
    collapsed: !openSections.has(id),
    onToggle: () => toggle(id),
  })

  return (
    <motion.div
      className={cn('space-y-4 pb-16', settings.compactMode && 'space-y-3')}
      initial="initial"
      animate="animate"
      variants={pageTransition}
    >
      <MyDayPanel />

      <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-4 border-t border-foreground pt-6">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-muted-foreground">04</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Analytics &amp; reports</h2>
        </div>
        <DashboardRefreshIndicator />
      </div>

      <DashboardSection
        {...sectionProps('kpis')}
        title="KPI Overview"
        description="Real-time sales metrics from Microsoft Dataverse"
      >
        <KpiMetricsGrid />
      </DashboardSection>

      <DashboardSection
        {...sectionProps('executive')}
        title="Executive Dashboard"
        description="Role-based KPIs — revenue, forecast, pipeline, win rate, and trends"
      >
        <ExecutiveDashboardPanel />
      </DashboardSection>

      <DashboardSection
        {...sectionProps('analytics')}
        title="Analytics"
        description="Pipeline, revenue, and lead distribution charts"
      >
        <DashboardChartsGrid />
      </DashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardSection
          {...sectionProps('funnel')}
          title="Lead Funnel"
          description="Lead progression by workflow stage"
        >
          <LeadFunnelPanel />
        </DashboardSection>

        <DashboardSection
          {...sectionProps('score-distribution')}
          title="Lead Score Distribution"
          description="Hot, warm, and cold qualified leads"
        >
          <LeadScoreDistributionPanel />
        </DashboardSection>
      </div>

      <DashboardSection
        {...sectionProps('disqualification')}
        title="Disqualification Insights"
        description="Reasons and patterns for disqualified leads"
      >
        <DisqualificationReportPanel />
      </DashboardSection>

      <DashboardSection
        {...sectionProps('recent-activity')}
        title="Recent Activity"
        description="Latest lead activity from Dataverse"
      >
        <RecentActivitiesPanel />
      </DashboardSection>

      <DashboardSection
        {...sectionProps('tables')}
        title="Records"
        description="Recent leads and opportunities"
      >
        <DashboardTablesGrid />
      </DashboardSection>
    </motion.div>
  )
}
