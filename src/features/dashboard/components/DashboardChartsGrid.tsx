import type { ReactNode } from 'react'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { Card, CardContent } from '@/components/ui/card'
import {
  DashboardBarChart,
  DashboardBarChartSkeleton,
} from '@/features/dashboard/components/DashboardBarChart'
import {
  useLeadsByOwnerChartQuery,
  useLeadsBySourceChartQuery,
  useLeadsByStatusChartQuery,
  useOpportunityByStageChartQuery,
  useOpportunityPipelineChartQuery,
  useRevenueTrendChartQuery,
} from '@/features/dashboard/hooks/useDashboardQueries'
import { formatCurrency } from '@/lib/formatters'

const CHART_PROPS = { compact: true } as const

function ChartCard({
  title,
  children,
  isLoading,
  isError,
  error,
  onRetry,
}: {
  title: string
  children: ReactNode
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-4">
        <AsyncBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={onRetry}
          loadingFallback={<DashboardBarChartSkeleton compact />}
          errorTitle={`Unable to load ${title}`}
        >
          {children}
        </AsyncBoundary>
      </CardContent>
    </Card>
  )
}

function OpportunityPipelineChart() {
  const query = useOpportunityPipelineChartQuery()
  const chartData =
    query.data?.data.map((stage) => ({
      label: stage.label,
      value: stage.value,
      count: stage.count,
    })) ?? []

  return (
    <ChartCard
      title="Opportunity Pipeline"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart
        title="Opportunity Pipeline"
        data={chartData}
        valueLabel="Value"
        formatValue={(value) => formatCurrency(value)}
        maxItems={6}
        {...CHART_PROPS}
      />
    </ChartCard>
  )
}

function OpportunityByStageChart() {
  const query = useOpportunityByStageChartQuery()

  return (
    <ChartCard
      title="Opportunity by Stage"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart title="Opportunity by Stage" data={query.data?.data ?? []} maxItems={8} {...CHART_PROPS} />
    </ChartCard>
  )
}

function RevenueTrendChart() {
  const query = useRevenueTrendChartQuery()
  const chartData =
    query.data?.data.map((point) => ({
      label: point.label,
      value: point.revenue,
      count: 0,
    })) ?? []

  return (
    <ChartCard
      title="Revenue Trend"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart
        title="Revenue Trend (6 months)"
        data={chartData}
        valueLabel="Revenue"
        formatValue={(value) => formatCurrency(value)}
        {...CHART_PROPS}
      />
    </ChartCard>
  )
}

function LeadsBySourceChart() {
  const query = useLeadsBySourceChartQuery()

  return (
    <ChartCard
      title="Leads by Source"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart title="Leads by Source" data={query.data?.data ?? []} maxItems={6} {...CHART_PROPS} />
    </ChartCard>
  )
}

function LeadsByOwnerChart() {
  const query = useLeadsByOwnerChartQuery()

  return (
    <ChartCard
      title="Leads by Owner"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart
        title="Leads by Owner"
        data={query.data?.data ?? []}
        maxItems={8}
        maxHeight="max-h-40"
        {...CHART_PROPS}
      />
    </ChartCard>
  )
}

function LeadsByStatusChart() {
  const query = useLeadsByStatusChartQuery()

  return (
    <ChartCard
      title="Leads by Status"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      <DashboardBarChart title="Leads by Status" data={query.data?.data ?? []} {...CHART_PROPS} />
    </ChartCard>
  )
}

export function DashboardChartsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <OpportunityPipelineChart />
      <OpportunityByStageChart />
      <RevenueTrendChart />
      <LeadsBySourceChart />
      <LeadsByOwnerChart />
      <LeadsByStatusChart />
    </div>
  )
}

export function DashboardChartsGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-border/60">
          <CardContent className="p-4">
            <DashboardBarChartSkeleton compact />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
