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
    <div className="relative flex h-full min-h-[auto] flex-col justify-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:justify-between lg:px-12 lg:py-12 xl:px-16">
      {settings.animatedBackground ? (
        /* ThreeUI Energy Orb shows through from the page; a soft scrim keeps the copy legible */
        <div className="absolute inset-0 bg-gradient-to-r from-[#081126]/96 via-[#0b1730]/88 to-[#0b2035]/75" />
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
          <img
            src="/logo.png"
            alt="Sonata"
            className="h-auto w-32 object-contain"
          />
          <div>
            <Typography variant="heading-l" className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              {APP_NAME}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5 text-slate-300">
              Enterprise sales platform · AI powered
            </Typography>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-8 max-w-2xl lg:mt-14">
          <Badge variant="secondary" className="mb-4 border border-sky-300/20 bg-sky-300/10 text-sky-100">
            <Target className="mr-1 size-3" />
            Built for modern revenue teams
          </Badge>
          <Typography variant="heading-xl" className="max-w-2xl text-[clamp(2rem,4.2vw,3.8rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
            Close more deals with{' '}
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
              intelligent CRM
            </span>
          </Typography>
          <Typography variant="body" tone="muted" className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Unified workspace for leads, opportunities, forecasting, and AI-assisted selling —
            connected to Microsoft Dataverse in real time.
          </Typography>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-7 flex flex-wrap gap-x-8 gap-y-4 lg:mt-10">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <Typography variant="heading-m" className="text-xl font-semibold text-white">
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
        className="relative z-10 mt-8 grid gap-2 sm:grid-cols-2 lg:mt-12"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={fadeIn}
              className="rounded-xl border border-white/10 bg-white/[0.045] p-3 transition-colors hover:bg-white/[0.075] sm:p-3.5"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-200/15 bg-sky-200/10">
                  <Icon className="size-4 text-sky-200" />
                </div>
                <div>
                  <Typography variant="body" className="text-sm font-semibold text-white">
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-1 text-slate-300 leading-relaxed">
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
