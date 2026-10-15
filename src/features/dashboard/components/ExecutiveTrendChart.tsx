import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Typography } from '@/components/ui/typography'
import type { ExecutiveTrendPoint } from '@/features/dashboard/api/DashboardApi'
import { formatKpiValue } from '@/features/dashboard/lib/dashboard-formatters'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'

interface ExecutiveTrendChartProps {
  title: string
  subtitle?: string
  data: ExecutiveTrendPoint[]
  metric: 'revenue' | 'pipeline' | 'forecast'
  className?: string
}

const METRIC_COLORS: Record<ExecutiveTrendChartProps['metric'], string> = {
  revenue: 'bg-emerald-500',
  pipeline: 'bg-blue-500',
  forecast: 'bg-violet-500',
}

export function ExecutiveTrendChart({
  title,
  subtitle,
  data,
  metric,
  className,
}: ExecutiveTrendChartProps) {
  if (!data.length) {
    return (
      <Typography variant="caption" tone="muted">
        No trend data available.
      </Typography>
    )
  }

  const values = data.map((point) => point[metric])
  const maxValue = Math.max(...values, 1)

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Typography variant="heading-m" className="text-sm font-semibold uppercase tracking-wide">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" tone="muted" className="mt-0.5">
            {subtitle}
          </Typography>
        )}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex h-32 items-end gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2"
      >
        {data.map((point, index) => {
          const value = point[metric]
          const heightPct = (value / maxValue) * 100
          return (
            <motion.div
              key={point.period}
              variants={fadeIn}
              custom={index}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <Typography
                variant="caption"
                className="hidden text-[9px] font-medium tabular-nums text-muted-foreground group-hover:block"
              >
                {formatKpiValue(value, 'currency')}
              </Typography>
              <motion.div
                className={cn('w-full min-h-[4px] rounded-t-sm opacity-90', METRIC_COLORS[metric])}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 4)}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
              />
              <Typography variant="caption" className="truncate text-[9px] text-muted-foreground">
                {point.label.replace(/\s20\d{2}$/, '')}
              </Typography>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export function ExecutiveComboTrendChart({
  title,
  data,
  className,
}: {
  title: string
  data: ExecutiveTrendPoint[]
  className?: string
}) {
  if (!data.length) return null

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const maxPipeline = Math.max(...data.map((d) => d.pipeline), 1)

  return (
    <div className={cn('space-y-3', className)}>
      <Typography variant="heading-m" className="text-sm font-semibold uppercase tracking-wide">
        {title}
      </Typography>
      <div className="flex h-36 items-end gap-2 rounded-lg border border-border/50 bg-gradient-to-b from-muted/30 to-background p-3">
        {data.map((point) => (
          <div key={point.period} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-0.5">
              <div
                className="w-[45%] rounded-t bg-emerald-500/90 transition-all"
                style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, 3)}%` }}
                title={`Revenue: ${formatKpiValue(point.revenue, 'currency')}`}
              />
              <div
                className="w-[45%] rounded-t bg-blue-500/70 transition-all"
                style={{ height: `${Math.max((point.pipeline / maxPipeline) * 100, 3)}%` }}
                title={`Pipeline: ${formatKpiValue(point.pipeline, 'currency')}`}
              />
            </div>
            <Typography variant="caption" className="truncate text-[9px] text-muted-foreground">
              {point.label}
            </Typography>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-emerald-500" /> Revenue
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-blue-500" /> Pipeline
        </span>
      </div>
    </div>
  )
}
