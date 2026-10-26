import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarClock, CircleAlert, ListTodo, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { fetchSalesBrief } from '@/features/ai-copilot/api/SalesAssistantApi'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { useUser } from '@/features/auth/hooks/useUser'
import { queryKeys } from '@/infrastructure/api/query-keys'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export function DashboardWelcome() {
  const { displayName, email } = useUser()
  const { open } = useAiCopilot()
  const brief = useQuery({
    queryKey: [...queryKeys.ai.all, 'brief', email, displayName],
    queryFn: () => fetchSalesBrief(email, displayName),
    enabled: Boolean(email),
    staleTime: 60_000,
  })

  const counts = brief.data?.counts
  const metrics = [
    { label: 'Overdue tasks', value: counts?.overdue_tasks, icon: ListTodo, href: '/workflow?view=overdue' },
    { label: 'Due today', value: counts?.tasks_due_today, icon: CalendarClock, href: '/workflow?view=due_today' },
    { label: 'Need attention', value: counts?.opportunities_needing_attention, icon: CircleAlert, href: '/intelligence/deals' },
    { label: 'Meetings this week', value: counts?.upcoming_meetings, icon: CalendarClock, href: '/workflow?view=meetings' },
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-col gap-5 p-5 sm:p-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">YOUR SALES WORKSPACE</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{greeting()}, {displayName.split(' ')[0] || 'there'}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Your pipeline, follow-ups and sales recommendations in one place.
          </p>
          {brief.isError && (
            <p role="status" className="text-sm text-muted-foreground">Your sales brief is temporarily unavailable. Dashboard records remain available below.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => open({ prompt: 'Give me my sales brief for today, including the most important follow-ups and opportunities needing attention.' })}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:self-auto"
        >
          <Sparkles className="size-4" /> Ask sales assistant <ArrowRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 border-t border-border/70 sm:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }, index) => (
          <Link
            key={label}
            to={href}
            className={`group flex min-w-0 items-center gap-3 p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 ${index > 0 ? 'sm:border-l sm:border-border/70' : ''} ${index % 2 === 1 ? 'border-l border-border/70 sm:border-l-0' : ''} ${index > 1 ? 'border-t border-border/70 sm:border-t-0' : ''}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-muted-foreground">{label}</span>
              <span className="mt-0.5 block text-xl font-semibold tabular-nums">{brief.isLoading ? '—' : value ?? '—'}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
