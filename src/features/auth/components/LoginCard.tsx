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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative w-full max-w-[410px] px-1"
    >
      
      
      <div className="relative rounded-2xl border border-border/80 bg-background p-5 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="absolute right-4 top-4">
          <ThemeSwitcher />
        </div>

        <CompanyLogo className="mb-5" />

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="mb-5 text-center"
        >
          <Typography variant="heading-l" className="mb-2 text-[1.7rem] font-semibold tracking-tight">
            Welcome back
          </Typography>
          <Typography variant="body" tone="muted">
            Access your sales workspace with your company account.
          </Typography>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
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
              'group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold shadow-none transition-colors duration-150',
              !isMockAuth &&
                'bg-[#1769aa] text-white hover:bg-[#125a92]',
            )}
            disabled={isLoading}
            onClick={() => void handleContinue()}
          >
            
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
                <ArrowRight className="size-4" />
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
