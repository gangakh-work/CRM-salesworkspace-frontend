import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import {
  EXECUTIVE_ROLES,
  type ExecutiveRole,
} from '@/features/dashboard/config/executive-dashboard.config'

interface ExecutiveRoleTabsProps {
  value: ExecutiveRole
  onChange: (role: ExecutiveRole) => void
  scopeLabel?: string
}

export function ExecutiveRoleTabs({ value, onChange, scopeLabel }: ExecutiveRoleTabsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
        {EXECUTIVE_ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-medium transition-all',
              value === role.id
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            {role.label}
          </button>
        ))}
      </div>
      {scopeLabel && (
        <Badge variant="outline" className="w-fit text-[10px] font-normal uppercase tracking-wider">
          Scope: {scopeLabel}
        </Badge>
      )}
    </div>
  )
}

export function ExecutiveRoleDescription({ role }: { role: ExecutiveRole }) {
  const config = EXECUTIVE_ROLES.find((item) => item.id === role)
  if (!config) return null
  return (
    <Typography variant="caption" tone="muted" className="mt-1">
      {config.description}
    </Typography>
  )
}
