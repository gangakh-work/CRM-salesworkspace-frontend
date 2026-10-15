import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
