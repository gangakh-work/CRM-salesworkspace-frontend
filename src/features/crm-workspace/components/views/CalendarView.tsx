import { addMonths, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useWorkspace } from '@/features/crm-workspace/context/WorkspaceProvider'
import { cn } from '@/lib/utils'

const TODAY = new Date('2026-08-04')

export function CalendarView() {
  const { records } = useWorkspace()
  const [currentDate, setCurrentDate] = useState(TODAY)

  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const getRecordsForDay = (day: Date) =>
    records.filter((r) => {
      const dateStr = r.dueDate ?? r.date
      try {
        const parsed = dateStr.length > 10 ? parseISO(dateStr) : parseISO(`${dateStr}T12:00:00`)
        return isSameDay(parsed, day)
      } catch {
        return r.date === format(day, 'yyyy-MM-dd')
      }
    })

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Typography variant="body" className="font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </Typography>
        <Button variant="ghost" size="icon-sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/60 p-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-muted/30 px-2 py-2 text-center">
            <Typography variant="caption" tone="muted" className="text-[10px] font-medium uppercase">
              {d}
            </Typography>
          </div>
        ))}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-24 bg-background/50" />
        ))}
        {days.map((day) => {
          const dayRecords = getRecordsForDay(day)
          const isToday = isSameDay(day, TODAY)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-24 bg-background/80 p-2 transition-colors hover:bg-muted/30',
                isToday && 'bg-primary/5 ring-1 ring-inset ring-primary/40',
              )}
            >
              <Typography variant="caption" className={cn('font-medium', isToday && 'text-primary')}>
                {format(day, 'd')}
              </Typography>
              <div className="mt-1 space-y-1">
                {dayRecords.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {r.title}
                  </div>
                ))}
                {dayRecords.length > 3 && (
                  <Badge variant="secondary" className="text-[9px]">
                    +{dayRecords.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
