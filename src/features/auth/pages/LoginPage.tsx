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
          ? 'crm-login-responsive relative isolate flex min-h-dvh overflow-x-hidden flex-col bg-[#080d1a] xl:h-dvh xl:overflow-hidden xl:flex-row'
          : 'crm-login-responsive relative flex min-h-dvh overflow-x-hidden flex-col xl:h-dvh xl:overflow-hidden xl:flex-row'
      }
    >
      {settings.animatedBackground && <AppBackdrop />}
      <div className="relative min-w-0 flex-1 xl:h-full xl:max-w-[56%] xl:overflow-y-auto">
        <LoginHero />
      </div>
      <div
        className={
          settings.animatedBackground
            ? 'relative flex flex-1 items-center justify-center border-t border-white/8 p-5 sm:p-8 min-w-0 xl:h-full xl:max-w-[44%] xl:border-l xl:border-t-0 xl:p-6'
            : 'relative flex flex-1 items-center justify-center border-t border-border/60 bg-background p-5 sm:p-8 min-w-0 xl:h-full xl:max-w-[44%] xl:border-l xl:border-t-0 xl:p-6'
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_55%)]" />
        <LoginCard />
      </div>
    </div>
  )
}
