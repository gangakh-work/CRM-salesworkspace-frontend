import type { ReactNode } from 'react'

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 border-b pb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography variant="heading-xl">{title}</Typography>
          {description && (
            <Typography variant="body" tone="muted" className="mt-1">
              {description}
            </Typography>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
