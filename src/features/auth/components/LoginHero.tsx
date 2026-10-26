import { motion } from 'framer-motion'
import { useSettings } from '@/hooks/useSettings'
import {
  BarChart3,
  Bot,
  Database,
  LayoutDashboard,
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
    <div className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden px-5 py-5 sm:px-8 sm:py-7 xl:px-10 xl:py-7 2xl:px-12">
      {settings.animatedBackground ? (
        /* ThreeUI Energy Orb shows through from the page; a soft scrim keeps the copy legible */
        <div className="absolute inset-0 bg-gradient-to-r from-[#090b12]/96 via-[#151219]/92 to-[#251b18]/85" />
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
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5">
            <img src="/logo.png" alt="Sonata logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <Typography variant="heading-l" className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              {APP_NAME}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5 text-slate-300">
              Enterprise sales platform · AI powered
            </Typography>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-5 max-w-2xl xl:mt-6">
          <Badge variant="secondary" className="mb-4 border border-orange-300/20 bg-orange-300/10 text-orange-100">
            <Target className="mr-1 size-3" />
            Built for modern revenue teams
          </Badge>
          <Typography variant="heading-xl" className="max-w-2xl text-[clamp(2rem,3.5vw,3.3rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
            Close more deals with{' '}
            <span className="bg-gradient-to-r from-orange-300 to-amber-400 bg-clip-text text-transparent">
              intelligent CRM
            </span>
          </Typography>
          <Typography variant="body" tone="muted" className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Unified workspace for leads, opportunities, forecasting, and AI-assisted selling —
            connected to Microsoft Dataverse in real time.
          </Typography>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-5 flex flex-wrap gap-x-7 gap-y-2 xl:mt-6">
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
        className="relative z-10 mt-5 grid grid-cols-2 gap-2 xl:mt-6"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={fadeIn}
              className="rounded-xl border border-white/10 bg-white/[0.045] p-2.5 transition-colors hover:bg-white/[0.075]"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-200/15 bg-sky-200/10">
                  <Icon className="size-4 text-orange-200" />
                </div>
                <div>
                  <Typography variant="body" className="text-sm font-semibold text-white">
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-0.5 text-slate-300 leading-snug text-xs">
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
