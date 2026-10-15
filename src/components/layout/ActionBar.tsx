import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface ActionBarProps {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

export function ActionBar({ left, right, className }: ActionBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  )
}
