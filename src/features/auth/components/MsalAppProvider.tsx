import { MsalProvider } from '@azure/msal-react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { MsalAuthProvider } from '@/features/auth/context/MsalAuthProvider'
import { ensureMsalInitialized, msalInstance } from '@/features/auth/lib/msal-instance'

interface MsalAppProviderProps {
  children: ReactNode
}

export function MsalAppProvider({ children }: MsalAppProviderProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void ensureMsalInitialized().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading sign-in" />
      </div>
    )
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthProvider>{children}</MsalAuthProvider>
    </MsalProvider>
  )
}
