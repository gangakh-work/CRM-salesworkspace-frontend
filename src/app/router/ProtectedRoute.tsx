import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AuthTransitionSplash } from '@/features/auth/components/AuthTransitionSplash'
import { routeMeta } from '@/config/routes'
import { useSession } from '@/features/auth/hooks/useSession'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return <AuthTransitionSplash label="Loading your workspace…" />
  }

  if (!isAuthenticated) {
    return <Navigate to={routeMeta.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
