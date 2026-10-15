import { Loader2 } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  visible?: boolean
  label?: string
  className?: string
}

export function LoadingOverlay({
  visible = true,
  label = 'Loading...',
  className,
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <Typography variant="caption" tone="muted">
          {label}
        </Typography>
      </div>
    </div>
  )
}
