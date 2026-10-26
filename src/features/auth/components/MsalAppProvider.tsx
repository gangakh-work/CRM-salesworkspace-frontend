import { MsalProvider } from '@azure/msal-react'
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
        <img src="/logo.png" alt="Sonata Software loading" className="h-16 w-16 animate-pulse object-contain" />
      </div>
    )
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthProvider>{children}</MsalAuthProvider>
    </MsalProvider>
  )
}
