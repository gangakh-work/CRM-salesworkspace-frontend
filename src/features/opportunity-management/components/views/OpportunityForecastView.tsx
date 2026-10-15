import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, BarChart3, Target, TrendingUp, Wallet } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { ForecastBadge, StageBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { fadeIn, staggerContainer } from '@/design-system/animations/motion'

const METRIC_ICONS = {
  quarterRevenue: Wallet,
  pipelineValue: BarChart3,
  weightedRevenue: TrendingUp,
  forecastAccuracy: Target,
}

export function OpportunityForecastView() {
  const { filteredOpportunities, forecastMetrics } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()

  const byForecast = ['commit', 'best_case', 'pipeline'] as const
  const commitDeals = filteredOpportunities.filter((o) => o.forecastCategory === 'commit' && o.status === 'open')
  const atRisk = filteredOpportunities.filter((o) => o.risk === 'high' && o.status === 'open')

  const metrics = [
    {
      key: 'quarterRevenue' as const,
      label: 'Quarter Revenue',
      value: formatCurrency(forecastMetrics.quarterRevenue),
      change: '+12.4%',
      up: true,
    },
    {
      key: 'pipelineValue' as const,
      label: 'Pipeline Value',
      value: formatCurrency(forecastMetrics.pipelineValue),
      change: '+8.2%',
      up: true,
    },
    {
      key: 'weightedRevenue' as const,
      label: 'Weighted Revenue',
      value: formatCurrency(forecastMetrics.weightedRevenue),
      change: '-2.1%',
      up: false,
    },
    {
      key: 'forecastAccuracy' as const,
      label: 'Forecast Accuracy',
      value: `${forecastMetrics.forecastAccuracy}%`,
      change: '+1.8%',
      up: true,
    },
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, value, change, up }) => {
          const Icon = METRIC_ICONS[key]
          return (
            <motion.div
              key={key}
              variants={fadeIn}
              className="rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-primary/5 p-5 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="size-5 text-primary" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {change}
                </span>
              </div>
              <Typography variant="heading-m" className="mt-3">
                {value}
              </Typography>
              <Typography variant="caption" tone="muted">
                {label} · {forecastMetrics.quarterLabel}
              </Typography>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={fadeIn} className="rounded-xl border border-border/60 bg-card/60 p-5">
          <Typography variant="heading-m" className="mb-4">
            Forecast by Category
          </Typography>
          <div className="space-y-4">
            {byForecast.map((cat) => {
              const items = filteredOpportunities.filter((o) => o.forecastCategory === cat && o.status === 'open')
              const total = items.reduce((s, o) => s + o.expectedRevenue, 0)
              const max = forecastMetrics.pipelineValue || 1
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between">
                    <ForecastBadge category={cat} />
                    <span className="text-sm font-semibold">{formatCurrency(total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / max) * 100}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <Typography variant="caption" tone="muted">
                    {items.length} opportunities
                  </Typography>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="rounded-xl border border-border/60 bg-card/60 p-5">
          <Typography variant="heading-m" className="mb-4">
            Commit Forecast
          </Typography>
          <div className="space-y-3">
            {commitDeals.length === 0 ? (
              <Typography variant="caption" tone="muted">
                No commit deals in current filter.
              </Typography>
            ) : (
              commitDeals.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => navigateToOpportunity(opp)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/40 p-3 text-left hover:border-primary/30"
                >
                  <div>
                    <Typography variant="body" className="text-sm font-semibold">
                      {opp.name}
                    </Typography>
                    <StageBadge stage={opp.stage} />
                  </div>
                  <Typography variant="body" className="font-bold">
                    {formatCurrency(opp.expectedRevenue, opp.currency)}
                  </Typography>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {atRisk.length > 0 && (
        <motion.div variants={fadeIn} className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <Typography variant="heading-m" className="mb-3 text-red-600 dark:text-red-400">
            High Risk Deals
          </Typography>
          <div className="grid gap-2 sm:grid-cols-2">
            {atRisk.map((opp) => (
              <button
                key={opp.id}
                type="button"
                onClick={() => navigateToOpportunity(opp)}
                className="rounded-lg border border-red-500/20 bg-background/60 p-3 text-left text-sm hover:border-red-500/40"
              >
                <span className="font-semibold">{opp.name}</span>
                <div className="mt-1 text-xs text-muted-foreground">
                  {opp.customer} · Close {opp.closeDate}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
