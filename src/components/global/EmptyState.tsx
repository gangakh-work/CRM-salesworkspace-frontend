export { EmptyState as EmptyStatePattern } from '@/components/patterns/state-components'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState as PatternEmptyState } from '@/components/patterns/state-components'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState(props: EmptyStateProps) {
  return <PatternEmptyState {...props} className={cn(props.className)} />
}
