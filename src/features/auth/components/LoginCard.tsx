import { motion } from 'framer-motion'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Typography } from '@/components/ui/typography'
import { env } from '@/config/env'
import { routeMeta } from '@/config/routes'
import { CompanyLogo } from '@/features/auth/components/CompanyLogo'
import { useSession } from '@/features/auth/hooks/useSession'
import { getStoredRememberMe } from '@/features/auth/lib/auth-storage'
import { ThemeSwitcher } from '@/shell/ThemeSwitcher'
import { transitions } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

export function LoginCard() {
  const navigate = useNavigate()
  const { login, isLoading } = useSession()
  const [rememberMe, setRememberMe] = useState(getStoredRememberMe)
  const isMockAuth = env.VITE_ENABLE_MOCK_AUTH

  const handleContinue = async () => {
    await login(rememberMe)
    if (isMockAuth) {
      navigate(routeMeta.defaultRedirect, { replace: true })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transitions.slow}
      className="relative w-full max-w-md px-1 sm:max-w-lg lg:max-w-md"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/10 blur-sm" />
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/25 to-violet-500/10" />
      <div className="relative rounded-2xl border border-border/60 bg-background/90 p-6 shadow-elevation-4 backdrop-blur-xl sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeSwitcher />
        </div>

        <CompanyLogo className="mb-8" />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.base, delay: 0.1 }}
          className="mb-8 text-center"
        >
          <Typography variant="heading-l" className="mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome back
          </Typography>
          <Typography variant="body" tone="muted">
            Sign in to access live Dataverse CRM, AI copilot, and sales dashboards
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.base, delay: 0.2 }}
          className="space-y-6"
        >
          {isMockAuth ? (
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="remember-me" className="text-sm font-medium">
                  Remember me
                </Label>
                <Typography variant="caption" tone="muted">
                  Keep me signed in on this device
                </Typography>
              </div>
              <Switch
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                aria-label="Remember me"
              />
            </div>
          ) : null}

          <Button
            className={cn(
              'group relative h-12 w-full overflow-hidden text-base font-semibold shadow-lg transition-all duration-300',
              !isMockAuth &&
                'bg-gradient-to-r from-[#2f2f2f] via-[#0078d4] to-[#005a9e] hover:shadow-primary/25 hover:brightness-110',
            )}
            disabled={isLoading}
            onClick={() => void handleContinue()}
          >
            {!isMockAuth ? (
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-0 transition-opacity group-hover:opacity-100" />
            ) : null}
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isMockAuth ? 'Continuing...' : 'Redirecting to Microsoft…'}
              </>
            ) : (
              <>
                {!isMockAuth ? (
                  <svg className="size-5" viewBox="0 0 21 21" aria-hidden>
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                ) : null}
                {isMockAuth ? 'Continue' : 'Sign in with Microsoft'}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>

          <Typography variant="caption" tone="muted" className="flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="size-3.5 shrink-0" />
            {isMockAuth
              ? 'Dev mode — mock authentication enabled'
              : 'Enterprise SSO · Secured with Microsoft Entra ID'}
          </Typography>
        </motion.div>
      </div>
    </motion.div>
  )
}
