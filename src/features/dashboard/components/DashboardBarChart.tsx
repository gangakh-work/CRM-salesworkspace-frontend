import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { ChartDataPoint } from '@/features/dashboard/api/DashboardApi'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

interface DashboardBarChartProps {
  title: string
  data: ChartDataPoint[]
  valueLabel?: string
  className?: string
  formatValue?: (value: number) => string
  /** Smaller bars and tighter spacing for dense dashboards */
  compact?: boolean
  /** Cap visible rows; remaining items scroll inside maxHeight */
  maxItems?: number
  /** Scroll container max height when data exceeds compact viewport */
  maxHeight?: string
}

export function DashboardBarChart({
  title,
  data,
  valueLabel = 'Count',
  className,
  formatValue = (value) => value.toLocaleString(),
  compact = false,
  maxItems,
  maxHeight = 'max-h-44',
}: DashboardBarChartProps) {
  if (!data.length) {
    return (
      <Typography variant="caption" tone="muted">
        No {title.toLowerCase()} data available.
      </Typography>
    )
  }

  const sorted = [...data].sort((a, b) => b.value - a.value)
  const visible = maxItems ? sorted.slice(0, maxItems) : sorted
  const maxValue = Math.max(...visible.map((item) => item.value), 1)
  const barHeight = compact ? 'h-5' : 'h-8'
  const rowGap = compact ? 'space-y-1.5' : 'space-y-3'
  const scrollable = sorted.length > visible.length || (compact && sorted.length > 5)

  const rows = (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={rowGap}>
      {visible.map((item, index) => {
        const widthPercent = (item.value / maxValue) * 100
        return (
          <motion.div key={`${item.label}-${index}`} variants={fadeIn} custom={index}>
            <div className={cn('mb-0.5 flex items-center justify-between gap-2', compact && 'mb-0')}>
              <Typography
                variant="body"
                className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')}
              >
                {item.label}
              </Typography>
              <Typography variant="caption" className="shrink-0 text-[11px] font-medium tabular-nums">
                {formatValue(item.value)}
                {valueLabel !== 'Count' ? ` ${valueLabel}` : ''}
              </Typography>
            </div>
            <div className={cn('relative overflow-hidden rounded-md bg-muted/50', barHeight)}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-md bg-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${widthPercent}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-4', className)}>
      <Typography variant="heading-m" className={compact ? 'text-sm font-semibold' : 'text-base'}>
        {title}
      </Typography>

      {scrollable ? (
        <div className={cn('overflow-y-auto pr-1', maxHeight)}>{rows}</div>
      ) : (
        rows
      )}

      {maxItems && sorted.length > maxItems && (
        <Typography variant="caption" tone="muted" className="text-[10px]">
          Showing top {maxItems} of {sorted.length}
        </Typography>
      )}

      <div className="flex items-center gap-1 text-success">
        <TrendingUp className={compact ? 'size-3' : 'size-4'} />
        <Typography variant="caption" className={cn('font-medium text-success', compact && 'text-[10px]')}>
          Live from Dataverse
        </Typography>
      </div>
    </div>
  )
}

export function DashboardBarChartSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <Skeleton className={cn(compact ? 'h-4 w-32' : 'h-5 w-40')} />
      {Array.from({ length: compact ? 5 : 4 }).map((_, index) => (
        <Skeleton key={index} className={cn('w-full rounded-md', compact ? 'h-5' : 'h-8')} />
      ))}
    </div>
  )
}
