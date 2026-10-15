import { useAuthContext } from '@/features/auth/context/auth-context'

export function useSession() {
  const { session, isAuthenticated, isLoading, rememberMe, login, logout } = useAuthContext()

  return {
    session,
    isAuthenticated,
    isLoading,
    rememberMe,
    login,
    logout,
  }
}
