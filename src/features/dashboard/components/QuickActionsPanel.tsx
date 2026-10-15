import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { QUICK_ACTIONS } from '@/features/crm-workspace/lib/workspace-config'

export function QuickActionsPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {QUICK_ACTIONS.map((action) => {
        return (
          <Button key={action.id} variant="outline" className="h-auto justify-start p-4" asChild>
            <Link to={action.href}>
              <Typography variant="body" className="text-sm font-medium">
                {action.label}
              </Typography>
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
