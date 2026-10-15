import { Navigate, useLocation } from 'react-router-dom'

import { AppBackdrop } from '@/components/threeui/AppBackdrop'
import { routeMeta } from '@/config/routes'
import { AuthTransitionSplash } from '@/features/auth/components/AuthTransitionSplash'
import { LoginCard } from '@/features/auth/components/LoginCard'
import { LoginHero } from '@/features/auth/components/LoginHero'
import { useSession } from '@/features/auth/hooks/useSession'
import { useSettings } from '@/hooks/useSettings'

export function LoginPage() {
  const { isAuthenticated, isLoading } = useSession()
  const { settings } = useSettings()
  const location = useLocation()
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? routeMeta.defaultRedirect

  if (isLoading) {
    return <AuthTransitionSplash label="Checking your session…" />
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div
      className={
        settings.animatedBackground
          ? 'relative isolate flex min-h-screen flex-col bg-[#05030e] lg:flex-row'
          : 'relative flex min-h-screen flex-col lg:flex-row'
      }
    >
      {settings.animatedBackground && <AppBackdrop />}
      <div className="relative min-h-[40vh] flex-1 lg:min-h-screen lg:max-w-[58%]">
        <LoginHero />
      </div>
      <div
        className={
          settings.animatedBackground
            ? 'relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:max-w-[42%] lg:p-10'
            : 'relative flex flex-1 items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 sm:p-6 lg:max-w-[42%] lg:p-10'
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <LoginCard />
      </div>
    </div>
  )
}
