import { X } from 'lucide-react'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void
  disabled?: boolean
}

export function Chip({ className, children, onRemove, disabled, ...props }: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
          aria-label="Remove"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
