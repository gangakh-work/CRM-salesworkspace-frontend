import { Sparkles } from 'lucide-react'

import { APP_NAME } from '@/config/constants'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  className?: string
}

export function CompanyLogo({ className }: CompanyLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-sm">
        <Sparkles className="size-7 text-primary" strokeWidth={1.75} />
        <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-md" />
      </div>
      <div className="text-center">
        <Typography variant="heading-m" className="tracking-tight">
          {APP_NAME}
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-1">
          AI Powered Enterprise Sales Platform
        </Typography>
      </div>
    </div>
  )
}
