import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { transitions } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  id: string
  title: string
  description?: string
  collapsed?: boolean
  onToggle?: () => void
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardSection({
  title,
  description,
  collapsed = false,
  onToggle,
  actions,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {onToggle ? (
            <button type="button" onClick={onToggle} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              <Typography variant="heading-m" className="text-sm">{title}</Typography>
            </button>
          ) : (
            <Typography variant="heading-m" className="text-sm">{title}</Typography>
          )}
          {description && (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              {description}
            </Typography>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label={`${collapsed ? 'Show' : 'Hide'} ${title}`}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.base}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

interface DashboardSectionSkeletonProps {
  rows?: number
  className?: string
}

export function DashboardSectionSkeleton({ rows = 1, className }: DashboardSectionSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="h-6 w-48 animate-shimmer rounded-md bg-muted" />
      <div className="grid gap-4" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 animate-shimmer rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export function SectionDragHandle() {
  return <GripVertical className="size-4 text-muted-foreground/50" aria-hidden />
}
