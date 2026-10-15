import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: { value: string; positive?: boolean }
  className?: string
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <Typography variant="heading-l">{value}</Typography>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <Badge variant={trend.positive ? 'success' : 'error'}>{trend.value}</Badge>
            )}
            {description && (
              <Typography variant="caption" tone="muted">
                {description}
              </Typography>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export interface KpiCardProps {
  label: string
  value: string | number
  target?: string | number
  unit?: string
  status?: 'success' | 'warning' | 'error' | 'neutral'
  className?: string
}

const statusColors = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-destructive',
  neutral: 'border-l-primary',
}

export function KpiCard({ label, value, target, unit, status = 'neutral', className }: KpiCardProps) {
  return (
    <Card className={cn('border-l-4', statusColors[status], className)}>
      <CardContent className="p-4">
        <Typography variant="caption" tone="muted">
          {label}
        </Typography>
        <div className="mt-1 flex items-baseline gap-1">
          <Typography variant="heading-xl">{value}</Typography>
          {unit && (
            <Typography variant="caption" tone="muted">
              {unit}
            </Typography>
          )}
        </div>
        {target !== undefined && (
          <Typography variant="caption" tone="muted" className="mt-1">
            Target: {target}
            {unit ? ` ${unit}` : ''}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: string
  icon?: LucideIcon
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const Icon = item.icon
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="relative flex gap-4 pb-6">
            {!isLast && <div className="absolute left-[15px] top-8 h-full w-px bg-border" />}
            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
              {Icon ? <Icon className="size-3.5" /> : <div className="size-2 rounded-full bg-primary" />}
            </div>
            <div className="flex-1 pt-0.5">
              <Typography variant="body" className="font-medium">
                {item.title}
              </Typography>
              {item.description && (
                <Typography variant="caption" tone="muted" className="mt-0.5">
                  {item.description}
                </Typography>
              )}
              <Typography variant="caption" tone="muted" className="mt-1">
                {item.timestamp}
              </Typography>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface ActivityCardProps {
  title: string
  subtitle?: string
  timestamp: string
  avatar?: ReactNode
  actions?: ReactNode
  className?: string
}

export function ActivityCard({ title, subtitle, timestamp, avatar, actions, className }: ActivityCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <Typography variant="body" className="font-medium">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              {subtitle}
            </Typography>
          )}
          <Typography variant="caption" tone="muted" className="mt-1">
            {timestamp}
          </Typography>
        </div>
        {actions}
      </div>
    </Card>
  )
}

export interface NotificationCardProps {
  title: string
  message: string
  timestamp: string
  read?: boolean
  onDismiss?: () => void
  className?: string
}

export function NotificationCard({
  title,
  message,
  timestamp,
  read = false,
  onDismiss,
  className,
}: NotificationCardProps) {
  return (
    <Card className={cn('p-4', !read && 'border-l-4 border-l-primary bg-primary/5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Typography variant="body" className="font-medium">
            {title}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1">
            {message}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-2">
            {timestamp}
          </Typography>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        )}
      </div>
    </Card>
  )
}
