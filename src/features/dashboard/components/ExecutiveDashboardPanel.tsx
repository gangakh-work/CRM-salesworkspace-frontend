import { useMemo, useState } from 'react'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { KpiGridSkeleton } from '@/components/patterns/skeletons'
import { Card } from '@/components/ui/card'
import { DashboardBarChart } from '@/features/dashboard/components/DashboardBarChart'
import { ExecutiveKpiStrip } from '@/features/dashboard/components/ExecutiveKpiStrip'
import {
  ExecutiveLeaderboard,
  ExecutiveTopOpportunities,
} from '@/features/dashboard/components/ExecutiveLeaderboard'
import {
  ExecutiveRoleDescription,
  ExecutiveRoleTabs,
} from '@/features/dashboard/components/ExecutiveRoleTabs'
import {
  ExecutiveComboTrendChart,
  ExecutiveTrendChart,
} from '@/features/dashboard/components/ExecutiveTrendChart'
import { EXECUTIVE_ROLE_CONFIG, mapUserRoleToExecutive } from '@/features/dashboard/config/executive-dashboard.config'
import { useExecutiveDashboardQuery } from '@/features/dashboard/hooks/useExecutiveDashboardQuery'
import { useUser } from '@/features/auth/hooks/useUser'
import type { ExecutiveRole } from '@/features/dashboard/api/DashboardApi'
import { formatKpiValue } from '@/features/dashboard/lib/dashboard-formatters'

const STORAGE_KEY = 'executive-dashboard-role'

function loadSavedRole(): ExecutiveRole | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'ceo' || value === 'sales_head' || value === 'manager' || value === 'sales_executive') {
      return value
    }
  } catch {
    /* ignore */
  }
  return null
}

export function ExecutiveDashboardPanel() {
  const { role: userRole, displayName } = useUser()
  const defaultRole = useMemo(() => loadSavedRole() ?? mapUserRoleToExecutive(userRole), [userRole])
  const [selectedRole, setSelectedRole] = useState<ExecutiveRole>(defaultRole)

  const ownerName = selectedRole === 'sales_executive' ? displayName : undefined
  const { data, isLoading, isError, error, refetch } = useExecutiveDashboardQuery(selectedRole, ownerName)

  const roleConfig = EXECUTIVE_ROLE_CONFIG[selectedRole]
  const dashboard = data?.data

  const handleRoleChange = (role: ExecutiveRole) => {
    setSelectedRole(role)
    try {
      localStorage.setItem(STORAGE_KEY, role)
    } catch {
      /* ignore */
    }
  }

  const pipelineChartData = useMemo(
    () =>
      (dashboard?.pipeline_by_stage ?? []).map((stage) => ({
        label: stage.label,
        value: stage.value,
        count: stage.count,
      })),
    [dashboard?.pipeline_by_stage],
  )

  return (
    <div className="space-y-4">
      <ExecutiveRoleTabs
        value={selectedRole}
        onChange={handleRoleChange}
        scopeLabel={dashboard?.scope === 'personal' ? 'My Portfolio' : roleConfig.scopeLabel}
      />
      <ExecutiveRoleDescription role={selectedRole} />

      <AsyncBoundary
        isLoading={isLoading || !dashboard}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        loadingFallback={<KpiGridSkeleton />}
        errorTitle="Unable to load executive dashboard"
      >
        {dashboard && (
          <div className="space-y-4">
            <ExecutiveKpiStrip role={selectedRole} kpis={dashboard.kpis} />

            <div className="grid gap-3 xl:grid-cols-2">
              {roleConfig.showMonthlyTrends && (
                <Card className="border-border/60 bg-card/90 p-4">
                  <ExecutiveComboTrendChart title="Monthly Trends" data={dashboard.monthly_trends.slice(-6)} />
                </Card>
              )}

              {roleConfig.showQuarterlyTrends && (
                <Card className="border-border/60 bg-card/90 p-4">
                  <ExecutiveTrendChart
                    title="Quarterly Revenue"
                    subtitle="Closed-won revenue by quarter"
                    data={dashboard.quarterly_trends}
                    metric="revenue"
                  />
                </Card>
              )}

              {!roleConfig.showQuarterlyTrends && roleConfig.showMonthlyTrends && (
                <Card className="border-border/60 bg-card/90 p-4">
                  <ExecutiveTrendChart
                    title="Forecast Trend"
                    subtitle="Weighted forecast by month"
                    data={dashboard.monthly_trends.slice(-6)}
                    metric="forecast"
                  />
                </Card>
              )}
            </div>

            {roleConfig.showPipelineByStage && (
              <Card className="border-border/60 bg-card/90 p-4">
                <DashboardBarChart
                  title="Pipeline by Stage"
                  data={pipelineChartData}
                  valueLabel=""
                  formatValue={(value) => formatKpiValue(value, 'currency')}
                  compact
                  maxItems={8}
                  maxHeight="max-h-40"
                />
              </Card>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              {roleConfig.showTopSalespeople && (
                <ExecutiveLeaderboard salespeople={dashboard.top_salespeople} />
              )}
              {roleConfig.showTopOpportunities && (
                <ExecutiveTopOpportunities opportunities={dashboard.top_opportunities} />
              )}
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}
