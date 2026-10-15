import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Typography } from '@/components/ui/typography'
import { env } from '@/config/env'
import { useSettings } from '@/hooks/useSettings'
import { useCrmEnvironment } from '@/hooks/useCrmEnvironment'
import { ThemeSwitcher } from '@/shell/ThemeSwitcher'
import { apiClient } from '@/infrastructure/api/client'

export function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const crm = useCrmEnvironment()

  useEffect(() => {
    void apiClient
      .get('/live')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Settings"
        description="Application preferences, environment, and API connectivity for Sales Hub UAT."
      />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <Typography variant="caption" tone="muted">Switch light / dark mode</Typography>
            </div>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="animations">UI animations</Label>
              <Typography variant="caption" tone="muted">Dashboard counters and transitions</Typography>
            </div>
            <Switch
              id="animations"
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) => updateSettings({ animationsEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-medium uppercase">{env.VITE_ENVIRONMENT}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">API base URL</span>
            <span className="truncate font-medium">{env.VITE_API_BASE_URL}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">API status</span>
            <span className={apiStatus === 'online' ? 'font-medium text-emerald-600' : 'font-medium text-destructive'}>
              {apiStatus === 'checking' ? 'Checking…' : apiStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Dynamics org</span>
            {crm.data?.dataverseUrl ? (
              <a
                href={crm.data.dataverseUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium text-primary underline-offset-2 hover:underline"
              >
                {crm.data.orgLabel}
              </a>
            ) : (
              <span className="font-medium">{crm.isLoading ? 'Checking…' : 'Not configured'}</span>
            )}
          </div>
          <Typography variant="caption" tone="muted">
            Leads and opportunities created in this app are written only to Dynamics UAT
            (sonatasoftwareltd-stage). They will not appear in DEV (sslcrmtest). In CRM, use
            All Leads / All Opportunities if a record is not under My records.
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}
