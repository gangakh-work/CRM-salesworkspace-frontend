import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { ExecutiveKpisData } from '@/features/dashboard/api/DashboardApi'
import {
  EXECUTIVE_ROLE_CONFIG,
  KPI_META,
  type ExecutiveKpiKey,
  type ExecutiveRole,
} from '@/features/dashboard/config/executive-dashboard.config'
import { formatKpiValue } from '@/features/dashboard/lib/dashboard-formatters'
import { cn } from '@/lib/utils'
import { staggerContainer } from '@/design-system/animations/motion'

function kpiValue(kpis: ExecutiveKpisData, key: ExecutiveKpiKey): number {
  return kpis[key]
}

interface ExecutiveKpiStripProps {
  role: ExecutiveRole
  kpis: ExecutiveKpisData
}

export function ExecutiveKpiStrip({ role, kpis }: ExecutiveKpiStripProps) {
  const config = EXECUTIVE_ROLE_CONFIG[role]
  const kpiKeys = config.kpis

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {kpiKeys.map((key, index) => {
        const meta = KPI_META[key]
        const value = kpiValue(kpis, key)
        const showTrend = key === 'revenue_mtd' && kpis.revenue_trend_pct !== 0
        const trendUp = kpis.revenue_trend_pct > 0

        return (
          <motion.div
            key={key}
            variants={staggerContainer}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              className={cn(
                'overflow-hidden border-border/60 bg-card/90 shadow-sm backdrop-blur-sm',
                'border-l-4',
                meta.accent,
              )}
            >
              <CardContent className="p-4">
                <Typography
                  variant="caption"
                  tone="muted"
                  className="text-[10px] font-semibold uppercase tracking-wider"
                >
                  {meta.title}
                </Typography>
                <Typography variant="heading-xl" className="mt-2 tabular-nums tracking-tight">
                  {formatKpiValue(value, meta.format)}
                </Typography>
                {showTrend && (
                  <div className="mt-2 flex items-center gap-1">
                    {trendUp ? (
                      <TrendingUp className="size-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="size-3.5 text-destructive" />
                    )}
                    <Typography variant="caption" className={trendUp ? 'text-emerald-600' : 'text-destructive'}>
                      {Math.abs(kpis.revenue_trend_pct)}% vs last month
                    </Typography>
                  </div>
                )}
                {!showTrend && (
                  <Typography variant="caption" tone="muted" className="mt-2 block">
                    Live from Dataverse
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
