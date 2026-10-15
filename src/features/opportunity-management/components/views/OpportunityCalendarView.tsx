import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { StageBadge } from '@/features/opportunity-management/components/OpportunityBadges'
import { formatCurrency } from '@/lib/formatters'
import { useNavigateToOpportunity } from '@/features/opportunity-management/hooks/useNavigateToOpportunity'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { fadeIn } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function OpportunityCalendarView() {
  const { filteredOpportunities } = useOpportunityManagement()
  const navigateToOpportunity = useNavigateToOpportunity()
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const byDate = useMemo(() => {
    const map: Record<string, typeof filteredOpportunities> = {}
    filteredOpportunities.forEach((opp) => {
      map[opp.closeDate] = map[opp.closeDate] ?? []
      map[opp.closeDate].push(opp)
    })
    return map
  }, [filteredOpportunities])

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Typography variant="heading-m">{monthLabel}</Typography>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="min-h-[5rem]" />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const events = byDate[dateStr] ?? []
          const isToday = dateStr === '2026-08-04'

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[5rem] rounded-lg border border-border/40 p-1.5 transition-colors',
                isToday && 'border-primary/50 bg-primary/5',
                events.length > 0 && 'bg-muted/20',
              )}
            >
              <span className={cn('text-xs font-medium', isToday && 'text-primary')}>{day}</span>
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 2).map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => navigateToOpportunity(opp)}
                    className="block w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] hover:bg-primary/20"
                    title={opp.name}
                  >
                    {opp.name}
                  </button>
                ))}
                {events.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{events.length - 2}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 space-y-2 border-t pt-4">
        <Typography variant="caption" className="font-semibold uppercase">
          Upcoming Close Dates
        </Typography>
        {[...filteredOpportunities]
          .filter((o) => o.status === 'open')
          .sort((a, b) => a.closeDate.localeCompare(b.closeDate))
          .slice(0, 5)
          .map((opp) => (
            <button
              key={opp.id}
              type="button"
              onClick={() => navigateToOpportunity(opp)}
              className="flex w-full items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-left text-sm hover:border-primary/30"
            >
              <div>
                <span className="font-medium">{opp.name}</span>
                <StageBadge stage={opp.stage} />
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(opp.expectedRevenue, opp.currency)}</div>
                <div className="text-xs text-muted-foreground">{opp.closeDate}</div>
              </div>
            </button>
          ))}
      </div>
    </motion.div>
  )
}
