import { useMemo } from 'react'

import { MOCK_USER } from '@/features/auth/constants/mock-user'
import { useAuthContext } from '@/features/auth/context/auth-context'

export function useUser() {
  const { user, isAuthenticated } = useAuthContext()

  return useMemo(
    () => ({
      user: user ?? MOCK_USER,
      isAuthenticated,
      displayName: user?.displayName ?? MOCK_USER.displayName,
      email: user?.email ?? MOCK_USER.email,
      role: user?.role ?? MOCK_USER.role,
      roles: user?.roles ?? MOCK_USER.roles,
      department: user?.department ?? MOCK_USER.department,
      initials: user?.initials ?? MOCK_USER.initials,
    }),
    [user, isAuthenticated],
  )
}
