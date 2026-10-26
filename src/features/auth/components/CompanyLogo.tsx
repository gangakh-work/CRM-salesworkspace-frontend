
import { APP_NAME } from '@/config/constants'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  className?: string
}

export function CompanyLogo({ className }: CompanyLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2">
        <img src="/logo.png" alt="Sonata logo" className="h-full w-full object-contain" />
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
