import type { ReactNode } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { NotificationProvider } from '@/app/providers/NotificationProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { SettingsProvider } from '@/app/providers/SettingsProvider'
import { SidebarProvider } from '@/app/providers/SidebarProvider'
import { MsalAppProvider } from '@/features/auth/components/MsalAppProvider'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { env } from '@/config/env'
import { DesignSystemProvider } from '@/design-system/provider'

interface AppProvidersProps {
  children: ReactNode
}

function CoreProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <SettingsProvider>
        <SidebarProvider>
          <NotificationProvider>
            <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          </NotificationProvider>
        </SidebarProvider>
      </SettingsProvider>
    </QueryProvider>
  )
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <DesignSystemProvider>
      {env.VITE_ENABLE_MOCK_AUTH ? (
        <AuthProvider>
          <CoreProviders>{children}</CoreProviders>
        </AuthProvider>
      ) : (
        <MsalAppProvider>
          <CoreProviders>{children}</CoreProviders>
        </MsalAppProvider>
      )}
    </DesignSystemProvider>
  )
}
