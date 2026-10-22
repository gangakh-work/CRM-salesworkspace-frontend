import { motion } from 'framer-motion'
import {
  DollarSign,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'

import { AsyncBoundary } from '@/components/patterns/AsyncBoundary'
import { KpiGridSkeleton } from '@/components/patterns/skeletons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useAnimatedCounter } from '@/features/dashboard/components/AnimatedCounter'
import { Sparkline } from '@/features/dashboard/components/Sparkline'
import type { DashboardKpisData } from '@/features/dashboard/api/DashboardApi'
import { KPI_DESCRIPTIONS } from '@/features/dashboard/config/kpi-descriptions.config'
import { formatKpiValue } from '@/features/dashboard/lib/dashboard-formatters'
import { useDashboardKpisQuery } from '@/features/dashboard/hooks/useDashboardQueries'
import type { KpiMetric, KpiStatus } from '@/features/dashboard/types/dashboard.types'
import { cardHover, staggerContainer } from '@/design-system/animations/motion'
import { useSettings } from '@/hooks/useSettings'

const statusBadge: Record<KpiStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'neutral',
}

function buildSparkline(value: number): number[] {
  const base = Math.max(value - 4, 0)
  return [base, base + 1, base + 1, base + 2, base + 2, base + 3, value]
}

function mapKpisToMetrics(data: DashboardKpisData): KpiMetric[] {
  return [
    {
      id: 'total-leads',
      title: 'Total Leads',
      value: data.total_leads,
      format: 'number',
      trend: 0,
      trendLabel: 'from Dataverse',
      status: 'neutral',
      sparkline: buildSparkline(data.total_leads),
      icon: UserPlus,
    },
    {
      id: 'open-opportunities',
      title: 'Active Opportunities',
      value: data.open_opportunities,
      format: 'number',
      trend: 0,
      trendLabel: 'active pipeline',
      status: 'success',
      sparkline: buildSparkline(data.open_opportunities),
      icon: Target,
    },
    {
      id: 'won-opportunities',
      title: 'Closed Won',
      value: data.won_opportunities,
      format: 'number',
      trend: 0,
      trendLabel: 'closed won',
      status: 'success',
      sparkline: buildSparkline(data.won_opportunities),
      icon: Trophy,
    },
    {
      id: 'lost-opportunities',
      title: 'Lost Opportunities',
      value: data.lost_opportunities,
      format: 'number',
      trend: 0,
      trendLabel: 'closed lost',
      status: data.lost_opportunities > 0 ? 'warning' : 'neutral',
      sparkline: buildSparkline(data.lost_opportunities),
      icon: TrendingDown,
    },
    {
      id: 'pipeline-value',
      title: 'Pipeline Value',
      value: data.pipeline_value,
      format: 'currency',
      trend: 0,
      trendLabel: 'open deals',
      status: 'success',
      sparkline: buildSparkline(Math.round(data.pipeline_value / 1000)),
      icon: TrendingUp,
    },
    {
      id: 'this-month-revenue',
      title: 'This Month Revenue',
      value: data.this_month_revenue,
      format: 'currency',
      trend: 0,
      trendLabel: 'won this month',
      status: 'success',
      sparkline: buildSparkline(Math.round(data.this_month_revenue / 1000)),
      icon: DollarSign,
    },
    {
      id: 'qualified-leads',
      title: 'Qualified Leads',
      value: data.qualified_leads,
      format: 'number',
      trend: 0,
      trendLabel: 'qualified in CRM',
      status: 'success',
      sparkline: buildSparkline(data.qualified_leads),
      icon: Users,
    },
    {
      id: 'conversion-rate',
      title: 'Conversion Rate',
      value: data.conversion_rate,
      format: 'percent',
      trend: 0,
      trendLabel: 'qualified vs disqualified',
      status: data.conversion_rate >= 30 ? 'success' : 'warning',
      sparkline: buildSparkline(data.conversion_rate),
      icon: Percent,
    },
  ]
}

function KpiCard({ metric, index }: { metric: KpiMetric; index: number }) {
  const { settings } = useSettings()
  const animatedValue = useAnimatedCounter(metric.value, {
    enabled: settings.animationsEnabled,
  })
  const Icon = metric.icon
  const isPositive = metric.trend > 0
  const isNeutral = metric.trend === 0
  const description = KPI_DESCRIPTIONS[metric.id]

  const card = (
    <motion.div initial="rest" whileHover="hover" variants={cardHover}>
      <Card className="group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="relative p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-3.5 text-primary" aria-hidden />
            </div>
            <Badge variant={statusBadge[metric.status]} className="text-[10px]">
              {metric.status === 'success'
                ? 'On track'
                : metric.status === 'warning'
                  ? 'Attention'
                  : metric.status === 'error'
                    ? 'At risk'
                    : 'Live'}
            </Badge>
          </div>

          <Typography variant="caption" tone="muted" className="mt-3 block">
            {metric.title}
          </Typography>

          <Typography variant="heading-l" className="mt-0.5 text-xl tabular-nums tracking-tight">
            {metric.format === 'currency' || metric.format === 'percent'
              ? formatKpiValue(
                  settings.animationsEnabled ? animatedValue : metric.value,
                  metric.format,
                )
              : formatKpiValue(metric.value, metric.format)}
          </Typography>

          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1">
              {!isNeutral &&
                (isPositive ? (
                  <TrendingUp className="size-3.5 text-success" aria-hidden />
                ) : (
                  <TrendingDown className="size-3.5 text-destructive" aria-hidden />
                ))}
              <Typography variant="caption" tone="muted">
                {metric.trendLabel}
              </Typography>
            </div>
            <Sparkline
              data={metric.sparkline ?? []}
              className="h-7 w-[4.5rem] text-primary"
              strokeClassName="stroke-primary"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <motion.div
      variants={staggerContainer}
      custom={index}
      initial={settings.animationsEnabled ? { opacity: 0, y: 12 } : false}
      animate={settings.animationsEnabled ? { opacity: 1, y: 0 } : false}
      transition={{ delay: index * 0.05 }}
    >
      {description ? (
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-center leading-snug">
            {description}
          </TooltipContent>
        </Tooltip>
      ) : (
        card
      )}
    </motion.div>
  )
}

export function KpiMetricsGrid() {
  const { data, isLoading, isError, error, refetch } = useDashboardKpisQuery()
  const metrics = useMemo(() => {
    if (!data) return []
    const preferredOrder = ['total-leads', 'qualified-leads', 'open-opportunities', 'won-opportunities']
    const allMetrics = mapKpisToMetrics(data.data)
    return preferredOrder
      .map((id) => allMetrics.find((metric) => metric.id === id))
      .filter((metric): metric is KpiMetric => Boolean(metric))
  }, [data])

  return (
    <TooltipProvider delayDuration={300}>
      <AsyncBoundary
      isLoading={isLoading || !data}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      loadingFallback={<KpiGridSkeleton />}
      errorTitle="Unable to load KPI metrics"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <KpiCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>
    </AsyncBoundary>
    </TooltipProvider>
  )
}
