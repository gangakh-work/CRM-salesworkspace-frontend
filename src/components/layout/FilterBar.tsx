import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-3 shadow-elevation-1',
        className,
      )}
    >
      {children}
    </div>
  )
}
