import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface CardGridSkeletonProps {
  count?: number
  className?: string
  itemClassName?: string
}

/** Card grid skeleton for list, kanban, and workspace views. */
export function CardGridSkeleton({
  count = 6,
  className,
  itemClassName = 'h-32 rounded-xl',
}: CardGridSkeletonProps) {
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={itemClassName} aria-hidden />
      ))}
    </div>
  )
}

export interface KpiGridSkeletonProps {
  count?: number
  className?: string
}

/** KPI metric grid skeleton for dashboard panels. */
export function KpiGridSkeleton({ count = 8, className }: KpiGridSkeletonProps) {
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
      role="status"
      aria-label="Loading metrics"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" aria-hidden />
      ))}
    </div>
  )
}

export interface ListSkeletonProps {
  count?: number
  className?: string
}

/** Vertical list skeleton for activity feeds and timelines. */
export function ListSkeleton({ count = 4, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" aria-hidden />
      ))}
    </div>
  )
}
