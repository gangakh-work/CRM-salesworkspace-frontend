import { Circle, Database, Wifi } from 'lucide-react'

import { APP_VERSION } from '@/config/constants'
import { env } from '@/config/env'
import { Typography } from '@/components/ui/typography'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const ENV_LABELS: Record<string, string> = {
  development: 'Development',
  uat: 'UAT',
  production: 'Production',
}

export function WorkspaceStatusBar() {
  const { resolvedTheme } = useTheme()

  return (
    <footer className="flex h-[var(--workspace-status-height)] shrink-0 items-center justify-between border-t border-border/60 bg-muted/30 px-4 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <StatusItem icon={Wifi} label="Connected" value="Online" variant="success" />
        <StatusItem label="Environment" value={ENV_LABELS[env.VITE_ENVIRONMENT] ?? env.VITE_ENVIRONMENT} />
        <StatusItem
          icon={Database}
          label="CRM"
          value="Live · Dataverse"
          variant="success"
          className="hidden sm:flex"
        />
        <StatusItem
          icon={Circle}
          label="Auth"
          value={env.VITE_ENABLE_MOCK_AUTH ? 'Dev bypass' : 'Microsoft SSO'}
          variant={env.VITE_ENABLE_MOCK_AUTH ? 'warning' : 'success'}
          className="hidden md:flex"
        />
      </div>
      <div className="flex items-center gap-4">
        <StatusItem label="Theme" value={resolvedTheme ?? 'system'} className="capitalize" />
        <Typography variant="caption" tone="muted">
          v{APP_VERSION}
        </Typography>
      </div>
    </footer>
  )
}

function StatusItem({
  icon: Icon,
  label,
  value,
  variant,
  className,
}: {
  icon?: typeof Wifi
  label: string
  value: string
  variant?: 'success' | 'warning'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Icon && (
        <Icon
          className={cn(
            'size-3',
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning fill-warning',
          )}
        />
      )}
      <Typography variant="caption" tone="muted">
        {label}:
      </Typography>
      <Typography variant="caption" className="font-medium">
        {value}
      </Typography>
    </div>
  )
}
