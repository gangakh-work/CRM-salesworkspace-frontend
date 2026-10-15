import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/auth-context'
import {
  clearSession,
  persistSession,
  restoreSession,
} from '@/features/auth/lib/auth-storage'
import type { SessionInfo, User } from '@/types'
import { setUserIdentity } from '@/infrastructure/api/client'

interface AuthProviderProps {
  children: ReactNode
}

function readInitialSession() {
  const session = restoreSession()
  // Before any page renders, so the first API requests already carry the identity.
  setUserIdentity(session.user?.email)
  return {
    user: session.user,
    rememberMe: session.rememberMe,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialSession] = useState(readInitialSession)
  const [user, setUser] = useState<User | null>(initialSession.user)
  const [rememberMe, setRememberMe] = useState(initialSession.rememberMe)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (remember = rememberMe) => {
    setIsLoading(true)
    try {
      const authenticatedUser = persistSession(remember)
      setUserIdentity(authenticatedUser.email)
      setUser(authenticatedUser)
      setRememberMe(remember)
    } finally {
      setIsLoading(false)
    }
  }, [rememberMe])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      clearSession()
      setUserIdentity(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const isAuthenticated = Boolean(user)

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
      isLoading,
      user,
      rememberMe,
      login,
      logout,
      session,
    }),
    [isAuthenticated, isLoading, user, rememberMe, login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { useAuthContext } from '@/features/auth/context/auth-context'
