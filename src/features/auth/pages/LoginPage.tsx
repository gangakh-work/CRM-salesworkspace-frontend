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
          ? 'relative isolate flex min-h-screen flex-col bg-[#080d1a] lg:flex-row'
          : 'relative flex min-h-screen flex-col lg:flex-row'
      }
    >
      {settings.animatedBackground && <AppBackdrop />}
      <div className="relative flex-1 lg:min-h-screen lg:max-w-[56%]">
        <LoginHero />
      </div>
      <div
        className={
          settings.animatedBackground
            ? 'relative flex flex-1 items-center justify-center border-t border-white/8 p-5 sm:p-8 lg:max-w-[44%] lg:border-l lg:border-t-0 lg:p-10'
            : 'relative flex flex-1 items-center justify-center border-t border-border/60 bg-background p-5 sm:p-8 lg:max-w-[44%] lg:border-l lg:border-t-0 lg:p-10'
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_55%)]" />
        <LoginCard />
      </div>
    </div>
  )
}
