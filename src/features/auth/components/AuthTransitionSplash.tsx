import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { CompanyLogo } from '@/features/auth/components/CompanyLogo'
import { Typography } from '@/components/ui/typography'

export function AuthTransitionSplash({ label = 'Opening your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <CompanyLogo />
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <Typography variant="body" tone="muted">
          {label}
        </Typography>
      </motion.div>
    </div>
  )
}
