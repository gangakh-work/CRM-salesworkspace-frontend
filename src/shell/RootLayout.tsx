import { Outlet } from 'react-router-dom'

import { AiCopilotProvider } from '@/features/ai-copilot/context/AiCopilotProvider'
import { AppShell } from '@/shell/AppShell'

export function ShellLayout() {
  return (
    <AiCopilotProvider>
      <AppShell />
    </AiCopilotProvider>
  )
}

export function RootLayout() {
  return <Outlet />
}
