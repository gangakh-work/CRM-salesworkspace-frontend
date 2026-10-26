import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { HeroVideo } from '@/components/patterns/HeroVideo'
import { WorkspaceGalleryHeading } from '@/components/threeui/WorkspaceGalleryHeading'
import { Reveal } from '@/components/patterns/Reveal'
import { RecordCard, RecordGallery, type RecordCardData } from '@/components/patterns/RecordGallery'
import { env } from '@/config/env'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { fetchSalesBrief, type SalesBrief } from '@/features/ai-copilot/api/SalesAssistantApi'
import { useUser } from '@/features/auth/hooks/useUser'
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
      videoSrc={env.VITE_WELCOME_VIDEO_URL}
      videoPoster={env.VITE_WELCOME_VIDEO_POSTER}
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
  videoSrc,
  videoPoster,
}: {
  firstName: string
  brief?: SalesBrief
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onAsk: (prompt: string) => void
  onOpenAssistant: () => void
  onOpenCard: (card: RecordCardData) => void
  videoSrc?: string
  videoPoster?: string
}) {
  const pipelineRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const go = (path: string) => navigate(path)
  const nextStep = (card: RecordCardData) =>
    card.kind === 'opportunity'
      ? { label: 'Next step', onClick: () => onAsk(`What should I do next for ${card.title}?`) }
      : undefined

  return (
    <section aria-labelledby="my-day-heading" className="mx-auto max-w-[1440px] space-y-12 pb-12 pt-2 text-foreground md:space-y-16">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="space-y-7 md:space-y-9">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>Sales Workspace</span>
          <span className="tabular-nums">{format(new Date(), 'EEEE — d MMMM yyyy')}</span>
        </div>

        <div>
          <h1
            id="my-day-heading"
            className="text-[clamp(2.6rem,5.7vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          >
            {greeting()}, {firstName}.
          </h1>
        </div>

        <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {brief ? headline(brief) : 'Everything that needs your attention today, in one place.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenAssistant}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ask the assistant <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onAsk('Give me my sales brief for today')}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start my day
            </button>
            <button
              type="button"
              onClick={() => pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex h-10 items-center gap-1.5 px-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
            >
              View pipeline <ArrowDown className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Media band: brand video if configured, else ThreeUI Gallery Heading ── */}
      <Reveal>
        {videoSrc ? (
          <HeroVideo src={videoSrc} poster={videoPoster} className="aspect-[16/7] w-full rounded-xl md:aspect-[21/7]">
            <div className="flex h-full flex-col justify-between p-6 text-white md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Today, in focus</p>
              {brief ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
                <Figure onMedia={true} label="Overdue tasks" value={brief.counts.overdue_tasks} onClick={() => go('/workflow?view=overdue')} definition="Your open Dataverse tasks with a due date before today." />
                <Figure onMedia={true} label="Due today" value={brief.counts.tasks_due_today} onClick={() => go('/workflow?view=due_today')} definition="Your open Dataverse tasks due today." />
                <Figure onMedia={true} label="Need attention" value={brief.counts.opportunities_needing_attention} onClick={() => go('/intelligence/deals')} definition="Your open opportunities with at least one risk or attention rule (overdue close date, overdue task, no next step, not updated 30+ days, missing fields)." />
                <Figure onMedia={true} label="Meetings this week" value={brief.counts.upcoming_meetings} onClick={() => go('/workflow?view=meetings')} definition="Your Dataverse appointments starting in the next 7 days." />
              </dl>
              ) : (
                <p className="text-3xl font-bold tracking-tight md:text-5xl">
                  {isLoading ? 'Loading your day…' : isError ? 'Your CRM data is unavailable.' : ''}
                </p>
              )}
            </div>
          </HeroVideo>
        ) : (
          <div className="space-y-6">
            <WorkspaceGalleryHeading className="block aspect-[16/7] w-full overflow-hidden rounded-xl md:aspect-[21/7]" />
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Today, in focus</p>
              {brief ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
                <Figure onMedia={false} label="Overdue tasks" value={brief.counts.overdue_tasks} onClick={() => go('/workflow?view=overdue')} definition="Your open Dataverse tasks with a due date before today." />
                <Figure onMedia={false} label="Due today" value={brief.counts.tasks_due_today} onClick={() => go('/workflow?view=due_today')} definition="Your open Dataverse tasks due today." />
                <Figure onMedia={false} label="Need attention" value={brief.counts.opportunities_needing_attention} onClick={() => go('/intelligence/deals')} definition="Your open opportunities with at least one risk or attention rule (overdue close date, overdue task, no next step, not updated 30+ days, missing fields)." />
                <Figure onMedia={false} label="Meetings this week" value={brief.counts.upcoming_meetings} onClick={() => go('/workflow?view=meetings')} definition="Your Dataverse appointments starting in the next 7 days." />
              </dl>
              ) : (
                <p className="text-2xl font-bold tracking-tight">
                  {isLoading ? 'Loading your day…' : isError ? 'Your CRM data is unavailable.' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </Reveal>

      {/* Shortcuts — text CTAs */}
      <nav aria-label="Assistant shortcuts" className="flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4">
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onAsk(s.prompt)}
            className="group inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          >
            <span className="underline-offset-[6px] group-hover:underline group-focus-visible:underline">{s.label}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </button>
        ))}
      </nav>

      {isError && (
        <div role="alert" className="border-t border-foreground pt-4 text-sm">
          Couldn't load your day from the CRM.{' '}
          <button type="button" className="font-semibold underline underline-offset-4" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {isLoading && <Skeleton />}

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
              parallax
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

function Figure({
  label,
  value,
  onClick,
  definition,
  onMedia = false,
}: {
  label: string
  value: number
  onClick: () => void
  /** Shown on hover / focus — the blueprint requires every metric to define itself. */
  definition?: string
  /** White type over the video band; theme colours otherwise. */
  onMedia?: boolean
}) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <button type="button" onClick={onClick} title={definition} aria-description={definition} className="group text-left focus-visible:outline-none">
          <span className="block text-5xl font-bold tabular-nums tracking-[-0.04em] md:text-7xl">{value}</span>
          <span
            className={cn(
              'mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] underline-offset-4 group-hover:underline group-focus-visible:underline',
              onMedia ? 'text-white/80' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
        </button>
      </dd>
    </div>
  )
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

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your day">
      <div className="h-10 w-64 animate-pulse bg-muted" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse border-t border-foreground/30 bg-muted/50" />
        ))}
      </div>
    </div>
  )
}
