import { motion } from 'framer-motion'
import { CloudSun, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchBox } from '@/components/ui/search-box'
import { Typography } from '@/components/ui/typography'
import { getTimeBasedGreeting } from '@/features/dashboard/lib/dashboard-formatters'
import { useUser } from '@/features/auth/hooks/useUser'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

interface HeroWelcomeBannerProps {
  onSearchFocus?: () => void
  className?: string
}

export function HeroWelcomeBanner({ onSearchFocus, className }: HeroWelcomeBannerProps) {
  const { displayName, role, department } = useUser()
  const firstName = displayName.split(' ')[0]
  const greeting = getTimeBasedGreeting()
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-4 md:p-5',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <motion.div variants={fadeIn} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {today}
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-normal">
              <CloudSun className="size-3.5" />
              Sales Workspace · Live Dataverse
            </Badge>
          </div>

          <div>
            <Typography variant="heading-l" className="tracking-tight">
              {greeting}, {firstName} 👋
            </Typography>
            <Typography variant="body" tone="muted" className="mt-1.5 max-w-xl text-sm">
              Executive dashboard with live revenue, forecast, pipeline, and performance trends from Dataverse.
            </Typography>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{role}</Badge>
            <Badge variant="neutral">{department}</Badge>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
          <SearchBox
            placeholder="Quick search customers, deals..."
            containerClassName="w-full sm:w-72 lg:w-80"
            onFocus={onSearchFocus}
            readOnly
            onClick={onSearchFocus}
            className="cursor-pointer bg-background/80 backdrop-blur-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/opportunities">View Pipeline</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/ai-assistant">
                <Search className="size-4" />
                Ask AI
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
