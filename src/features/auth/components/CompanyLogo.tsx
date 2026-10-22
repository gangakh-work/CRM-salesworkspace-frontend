

import { APP_NAME } from '@/config/constants'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  className?: string
}

export function CompanyLogo({ className }: CompanyLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <img
        src="/logo.png"
        alt="Sonata"
        className="h-auto w-32 object-contain"
      />
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
