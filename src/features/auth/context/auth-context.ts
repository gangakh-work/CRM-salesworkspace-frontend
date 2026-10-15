import { createContext, useContext } from 'react'

import type { AuthState, SessionInfo, User } from '@/types'

export interface AuthContextValue extends AuthState {
  rememberMe: boolean
  login: (rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  session: SessionInfo
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an auth provider')
  }
  return context
}

export type { User }
