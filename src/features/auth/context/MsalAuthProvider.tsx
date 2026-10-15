import { useMsal } from '@azure/msal-react'
import { env } from '@/config/env'
import { InteractionStatus } from '@azure/msal-browser'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { loginRequest } from '@/config/msalConfig'
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/auth-context'
import { ensureMsalInitialized } from '@/features/auth/lib/msal-instance'
import { acquireApiAccessToken } from '@/features/auth/lib/msal-token'
import { mapMsalAccountToUser } from '@/features/auth/lib/msal-user'
import { setAuthToken, setUserIdentity } from '@/infrastructure/api/client'
import type { SessionInfo, User } from '@/types'

interface MsalAuthProviderProps {
  children: ReactNode
}

async function syncActiveAccount(
  instance: ReturnType<typeof useMsal>['instance'],
  accounts: ReturnType<typeof useMsal>['accounts'],
): Promise<User | null> {
  const account = instance.getActiveAccount() ?? accounts[0] ?? null
  if (!account) {
    setAuthToken(null)
    return null
  }

  instance.setActiveAccount(account)
  const token = await acquireApiAccessToken(instance, account)
  if (token) {
    setAuthToken(token)
    return mapMsalAccountToUser(account)
  }

  // Never render the CRM as signed in when the API access token could not be
  // acquired. This is the exact failure that otherwise produces "token required".
  setAuthToken(null)
  return null
}

export function MsalAuthProvider({ children }: MsalAuthProviderProps) {
  const { instance, accounts, inProgress } = useMsal()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) {
      return
    }

    let cancelled = false

    void (async () => {
      await ensureMsalInitialized()
      await instance.handleRedirectPromise()

      const account = instance.getActiveAccount() ?? accounts[0] ?? null
      if (account && !cancelled) {
        instance.setActiveAccount(account)
        setUserIdentity(account.username)
        setUser(mapMsalAccountToUser(account))
      }

      const nextUser = account ? await syncActiveAccount(instance, accounts) : null
      if (!cancelled) {
        setUserIdentity(nextUser?.email)
        setUser(nextUser)
        setAuthError(account && !nextUser
          ? 'Microsoft sign-in succeeded, but an API access token could not be acquired. Check the exposed API scope and granted consent in Entra ID.'
          : null)
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [instance, accounts, inProgress])

  const login = useCallback(async () => {
    setAuthError(null)
    if (!env.VITE_MSAL_CLIENT_ID || !env.VITE_MSAL_TENANT_ID || !env.VITE_MSAL_API_SCOPE) {
      setAuthError('Microsoft sign-in configuration is incomplete. Set the frontend Entra client ID, tenant ID, and API scope.')
      return
    }
    setIsLoading(true)
    await instance.loginRedirect(loginRequest)
  }, [instance])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      setAuthToken(null)
      setUserIdentity(null)
      setUser(null)
      setAuthError(null)
      await instance.logoutRedirect()
    } finally {
      setIsLoading(false)
    }
  }, [instance])

  useEffect(() => { if (authError) console.error('[Authentication]', authError) }, [authError])

  const isAuthenticated = Boolean(user)
  const rememberMe = false

  const session = useMemo<SessionInfo>(
    () => ({
      isAuthenticated,
      rememberMe,
      user,
    }),
    [isAuthenticated, rememberMe, user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading: isLoading || inProgress !== InteractionStatus.None,
      user,
      rememberMe,
      login,
      logout,
      session,
    }),
    [isAuthenticated, isLoading, inProgress, user, rememberMe, login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { useAuthContext } from '@/features/auth/context/auth-context'
