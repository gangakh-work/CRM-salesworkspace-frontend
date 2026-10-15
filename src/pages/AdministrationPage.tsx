import { Shield, User } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { env } from '@/config/env'
import { useUser } from '@/features/auth/hooks/useUser'
import { isOpportunityAdmin } from '@/features/opportunity-management/lib/auth-roles'
import { useCrmEnvironment } from '@/hooks/useCrmEnvironment'

export function AdministrationPage() {
  const user = useUser()
  const isAdmin = isOpportunityAdmin(user?.roles)
  const crm = useCrmEnvironment()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Administration"
        description="User access, roles, and CRM integration status for Sales Hub UAT."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Signed-in user
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.displayName ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Roles</span>
            <span className="flex flex-wrap justify-end gap-1">
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} variant="neutral">{role}</Badge>
              ))}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Admin access</span>
            <Badge variant={isAdmin ? 'success' : 'warning'}>{isAdmin ? 'Enabled' : 'Standard user'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            CRM integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Typography variant="body" tone="muted">
            Backend service principal: <strong>app-sales-crm-hub-api</strong>
          </Typography>
          <Typography variant="body" tone="muted">
            Dataverse writes go to{' '}
            {crm.data?.dataverseUrl ? (
              <a
                href={crm.data.dataverseUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {crm.data.orgLabel}
              </a>
            ) : (
              <strong>the configured UAT org</strong>
            )}
            . DEV (sslcrmtest) is a different Dynamics organization and will not show these records.
          </Typography>
          <Typography variant="body" tone="muted">
            Backend API: {env.VITE_API_BASE_URL}
          </Typography>
          {isAdmin ? (
            <Typography variant="caption" tone="muted">
              Admin users can assign owners on locked opportunities and skip stage gates in UAT.
            </Typography>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
