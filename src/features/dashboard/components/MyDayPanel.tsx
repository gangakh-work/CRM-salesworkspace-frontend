import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Sparkles } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Reveal } from '@/components/patterns/Reveal'
import { RecordCard, RecordGallery, type RecordCardData } from '@/components/patterns/RecordGallery'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { fetchSalesBrief, type SalesBrief } from '@/features/ai-copilot/api/SalesAssistantApi'
import { useUser } from '@/features/auth/hooks/useUser'
import { KpiMetricsGrid } from '@/features/dashboard/components/KpiMetricsGrid'
import { queryKeys } from '@/infrastructure/api/query-keys'
import { cn } from '@/lib/utils'

const SHORTCUTS = [
  { label: 'Sales brief', prompt: 'Give me my sales brief for today' },
  { label: 'Overdue tasks', prompt: 'Show my overdue tasks' },
  { label: 'At-risk deals', prompt: 'Which opportunities need attention?' },
  { label: 'Meetings', prompt: 'Show my upcoming meetings' },
  { label: 'Proposals', prompt: 'Show proposals' },
  { label: 'New opportunity', prompt: 'Create an opportunity' },
]

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/**
 * Salesperson welcome — editorial, black & white.
 * Every number comes from /ai/agent/brief (live Dataverse data, scoped to
 * the signed-in user). Nothing is estimated client-side.
 */
export function MyDayPanel() {
  const { displayName, email } = useUser()
  const { open } = useAiCopilot()
  const navigate = useNavigate()

  const brief = useQuery({
    queryKey: [...queryKeys.ai.all, 'brief', email, displayName],
    queryFn: () => fetchSalesBrief(email, displayName),
    enabled: Boolean(email),
    staleTime: 60_000,
  })

  return (
    <MyDayView
      firstName={displayName.split(' ')[0] || 'there'}
      brief={brief.data}
      isLoading={brief.isLoading}
      isError={brief.isError}
      onRetry={() => void brief.refetch()}
      onAsk={(prompt) => open({ prompt })}
      onOpenAssistant={() => open()}
      onOpenCard={(card) => card.href && navigate(card.href)}
    />
  )
}

/** Presentational view (no data fetching). */
export function MyDayView({
  firstName,
  brief,
  isLoading,
  isError,
  onRetry,
  onAsk,
  onOpenAssistant,
  onOpenCard,
}: {
  firstName: string
  brief?: SalesBrief
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onAsk: (prompt: string) => void
  onOpenAssistant: () => void
  onOpenCard: (card: RecordCardData) => void
}) {
  const pipelineRef = useRef<HTMLDivElement>(null)
  const nextStep = (card: RecordCardData) =>
    card.kind === 'opportunity'
      ? { label: 'Next step', onClick: () => onAsk(`What should I do next for ${card.title}?`) }
      : undefined


  return (
    <section aria-labelledby="my-day-heading" className="mx-auto max-w-[1440px] space-y-5 pb-5 pt-1 text-foreground md:space-y-6">
      {/* Compact, task-first dashboard header */}
      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <CalendarDays className="size-3.5" />
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </span>
          </div>
          <div>
            <h1 id="my-day-heading" className="text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-4xl">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {brief ? headline(brief) : 'Your priorities, customer conversations, and deals that need attention.'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Sparkles className="size-4" /> Ask AI <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAsk('Give me my sales brief for today')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CheckCircle2 className="size-4 text-muted-foreground" /> Start my day
          </button>
          <button
            type="button"
            onClick={() => pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pipeline <ArrowDown className="size-4" />
          </button>
        </div>
      </header>

      {/* Primary business KPIs — sourced from the live CRM dashboard API. */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Sales at a glance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Live performance from your CRM</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', isError ? 'bg-rose-500' : isLoading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500')} />
            {isError ? 'Connection issue' : isLoading ? 'Refreshing data' : 'CRM connected'}
          </span>
        </div>
        <KpiMetricsGrid />
      </div>

      {/* Assistant shortcuts are useful actions, not decorative navigation */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
          <div>
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <p className="text-xs text-muted-foreground">Ask the assistant to take you straight to what matters</p>
          </div>
        </div>
        <nav aria-label="Assistant shortcuts" className="flex flex-wrap gap-2">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onAsk(s.prompt)}
              className="group inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {s.label}
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </button>
          ))}
        </nav>
      </div>

      {isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <span>Couldn't load your latest CRM priorities.</span>
          <button type="button" className="font-semibold underline underline-offset-4" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {brief && (
        <>
          <Attention brief={brief} onOpenCard={onOpenCard} nextStep={nextStep} />
          <Today brief={brief} />
          <div ref={pipelineRef} className="scroll-mt-6">
            <RecordGallery
              eyebrow="03"
              title="Pipeline"
              cards={brief.pipeline ?? []}
              onOpen={onOpenCard}
              primaryAction={nextStep}
              parallax={false}
              emptyText="You have no open opportunities."
            />
          </div>
        </>
      )}
    </section>
  )
}

function headline(b: SalesBrief): string {
  const c = b.counts
  const parts: string[] = []
  if (c.overdue_tasks) parts.push(`${c.overdue_tasks} overdue task${c.overdue_tasks > 1 ? 's' : ''}`)
  if (c.opportunities_needing_attention)
    parts.push(`${c.opportunities_needing_attention} deal${c.opportunities_needing_attention > 1 ? 's' : ''} needing attention`)
  if (c.upcoming_meetings) parts.push(`${c.upcoming_meetings} meeting${c.upcoming_meetings > 1 ? 's' : ''} this week`)
  return parts.length ? `You have ${parts.join(', ')}.` : 'Nothing urgent today. A good day to move deals forward.'
}

function SectionHeader({ index, title, extra }: { index: string; title: string; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <p className="font-mono text-[11px] text-muted-foreground">{index}</p>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      </div>
      {extra}
    </div>
  )
}

function Attention({
  brief,
  onOpenCard,
  nextStep,
}: {
  brief: SalesBrief
  onOpenCard: (card: RecordCardData) => void
  nextStep: (card: RecordCardData) => { label: string; onClick: () => void } | undefined
}) {
  const ids = new Set(brief.opportunities.map((o) => o.id))
  const cards = (brief.pipeline ?? []).filter((c) => ids.has(c.id)).slice(0, 3)
  return (
    <div className="space-y-8">
      <SectionHeader index="01" title="Needs attention" />
      {cards.length === 0 ? (
        <p className="border-t border-foreground pt-6 text-lg text-muted-foreground">All your open deals look on track.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
          {cards.map((card, i) => {
            const o = brief.opportunities.find((x) => x.id === card.id)
            return (
              <Reveal key={card.id} delay={i * 0.08} className="space-y-3">
                <RecordCard card={card} index={i} onOpen={onOpenCard} primaryAction={nextStep(card)} />
                {o && (
                  <p className="px-4 text-sm leading-relaxed text-muted-foreground" title={o.flags.map((f) => f.evidence).join('\n')}>
                    {o.flags.slice(0, 2).map((f) => f.text).join('. ')}.
                  </p>
                )}
              </Reveal>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Today({ brief }: { brief: SalesBrief }) {
  return (
    <div className="space-y-8">
      <SectionHeader
        index="02"
        title="Today"
        extra={
          <Link
            to="/workspace/tasks"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] hover:opacity-70"
          >
            All tasks
          </Link>
        }
      />
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Priority tasks</p>
          {brief.tasks.length === 0 ? (
            <p className="border-t border-foreground pt-4 text-muted-foreground">No open tasks assigned to you.</p>
          ) : (
            <ol className="border-b border-foreground/15">
              {brief.tasks.slice(0, 6).map((t, i) => (
                <li key={t.id} className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-t border-foreground/15 py-4 first:border-foreground">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold">{t.subject}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.regarding ? `${t.regarding} — ` : ''}
                      <span className={cn(t.overdue && 'font-semibold text-foreground underline decoration-1 underline-offset-2')}>
                        {t.due_label}
                      </span>
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t.priority_label}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meetings</p>
          {brief.meetings.length === 0 ? (
            <p className="border-t border-foreground pt-4 text-muted-foreground">No meetings in the next 7 days.</p>
          ) : (
            <ul className="border-b border-foreground/15">
              {brief.meetings.slice(0, 4).map((m) => (
                <li key={m.id} className="grid grid-cols-[4rem_1fr] items-baseline gap-4 border-t border-foreground/15 py-4 first:border-foreground">
                  <span className="leading-none">
                    <span className="block text-3xl font-bold tabular-nums tracking-tight">{format(new Date(m.date), 'd')}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {format(new Date(m.date), 'MMM')}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold">{m.subject}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[m.time, m.regarding].filter(Boolean).join(' — ') || 'Appointment'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

