import { motion } from 'framer-motion'
import { useSettings } from '@/hooks/useSettings'
import {
  BarChart3,
  Bot,
  Database,
  LayoutDashboard,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { APP_NAME } from '@/config/constants'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Executive Dashboard',
    description: 'Live KPIs, pipeline health, and AI recommendations from Dataverse.',
  },
  {
    icon: Users,
    title: 'Lead & Opportunity 360°',
    description: 'Full-funnel workspace with qualify, convert, and stage management.',
  },
  {
    icon: Bot,
    title: 'AI Sales Assistant',
    description: 'Summarize records, draft emails, and get next-best actions in context.',
  },
  {
    icon: Workflow,
    title: 'Workflow Engine',
    description: 'Guided sales playbooks with approvals and progress tracking.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Disqualification trends, forecast metrics, and lost-deal insights.',
  },
  {
    icon: Database,
    title: 'Microsoft Dataverse',
    description: 'Native CRM integration — live leads, opportunities, and activities.',
  },
] as const

const STATS = [
  { label: 'Pipeline visibility', value: '360°' },
  { label: 'CRM data source', value: 'Live' },
  { label: 'AI capabilities', value: '12+' },
] as const

export function LoginHero() {
  const { settings } = useSettings()
  return (
    <div className="relative flex h-full min-h-[480px] flex-col justify-between overflow-hidden p-8 md:p-12 lg:p-14">
      {settings.animatedBackground ? (
        /* ThreeUI Energy Orb shows through from the page; a soft scrim keeps the copy legible */
        <div className="absolute inset-0 bg-gradient-to-r from-[#05030e]/80 via-[#05030e]/45 to-transparent" />
      ) : (
        <>
          {/* Hero image layer */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-primary/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-violet-600/10" />
        </>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <motion.div variants={fadeIn} className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 backdrop-blur-sm">
            <Sparkles className="size-6 text-primary" />
          </div>
          <div>
            <Typography variant="heading-l" className="text-2xl md:text-3xl">
              {APP_NAME}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5">
              Enterprise sales platform · AI powered
            </Typography>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-10 max-w-xl">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
            <Target className="mr-1 size-3" />
            Built for modern revenue teams
          </Badge>
          <Typography variant="heading-xl" className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
            Close more deals with{' '}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              intelligent CRM
            </span>
          </Typography>
          <Typography variant="body" tone="muted" className="mt-4 max-w-lg text-base leading-relaxed">
            Unified workspace for leads, opportunities, forecasting, and AI-assisted selling —
            connected to Microsoft Dataverse in real time.
          </Typography>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-10 flex flex-wrap gap-6">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <Typography variant="heading-m" className="text-2xl font-bold text-primary">
                {stat.value}
              </Typography>
              <Typography variant="caption" tone="muted">
                {stat.label}
              </Typography>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={fadeIn}
              className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur-md transition-colors hover:bg-background/55"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <Typography variant="body" className="text-sm font-semibold">
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-1 leading-relaxed">
                    {feature.description}
                  </Typography>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
