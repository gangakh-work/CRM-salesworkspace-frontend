import { motion } from 'framer-motion'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

export function ProgressIndicator({
  value,
  size = 'md',
  showLabel = true,
  className,
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <Typography variant="caption" tone="muted" className="text-xs">
            Progress
          </Typography>
          <Typography variant="caption" className="text-xs font-semibold tabular-nums">
            {clamped}%
          </Typography>
        </div>
      )}
      <div className={cn('overflow-hidden rounded-full bg-muted/60', height)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            clamped >= 100
              ? 'bg-emerald-500'
              : clamped >= 60
                ? 'bg-primary'
                : clamped >= 30
                  ? 'bg-amber-500'
                  : 'bg-muted-foreground/40',
          )}
        />
      </div>
    </div>
  )
}
