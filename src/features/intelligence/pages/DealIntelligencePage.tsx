import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { useUser } from '@/features/auth/hooks/useUser'
import { intelApi, type DealIntel, type Insight } from '@/features/intelligence/api/intelApi'
import { LoadState, PageHeader, Severity, Why } from '@/features/intelligence/components/IntelUi'
import { money } from '@/features/intelligence/lib/money'
import { cn } from '@/lib/utils'

const FILTERS = ['all', 'high', 'medium', 'ok'] as const

export function DealIntelligencePage() {
  const { email, displayName } = useUser()
  const [tab, setTab] = useState<'deals' | 'team'>('deals')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const team = tab === 'team'

  const q = useQuery({
    queryKey: ['intel', 'deals', email, team],
    queryFn: () => intelApi.deals(email, displayName, team),
    enabled: Boolean(email),
  })
  const deals = (q.data?.deals ?? []).filter((d) => filter === 'all' || d.severity === filter)
  const counts = Object.fromEntries(FILTERS.map((f) => [f, (q.data?.deals ?? []).filter((d) => f === 'all' || d.severity === f).length]))

  return (
    <div className="mx-auto max-w-[1300px] space-y-8 pb-16 pt-4">
      <PageHeader
        eyebrow="Deal intelligence"
        title="Where deals need you."
        subtitle="Explainable rules over your open opportunities. Every insight shows the CRM fields it is based on — no invented scores or win probabilities."
        actions={
          q.data?.can_view_team && (
            <div className="flex rounded-full border p-1" role="tablist">
              {(['deals', 'team'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium',
                    tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'deals' ? 'My deals' : 'Team inspection'}
                </button>
              ))}
            </div>
          )
        }
      />

      <LoadState isLoading={q.isLoading} error={q.error} onRetry={() => void q.refetch()}>
        {team && q.data?.team && <TeamTable rows={q.data.team} />}

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm capitalize',
                filter === f ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground/40',
              )}
            >
              {f === 'ok' ? 'On track' : f === 'all' ? 'All' : `${f} risk`} <span className="opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {deals.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No open opportunities match.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} showOwner={team} />
            ))}
          </div>
        )}

        {q.data && (
          <section className="space-y-2 rounded-2xl border bg-card/60 p-5 text-sm">
            <h2 className="font-semibold">Not evaluated</h2>
            <ul className="space-y-1 text-muted-foreground">
              {q.data.not_evaluated.map((n) => (
                <li key={n.rule}>
                  <strong className="font-medium text-foreground">{n.rule}</strong> — {n.reason}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Recomputed from live data at {format(new Date(q.data.generated_at), 'HH:mm')}.</p>
          </section>
        )}
      </LoadState>
    </div>
  )
}

function DealCard({ deal, showOwner }: { deal: DealIntel; showOwner: boolean }) {
  return (
    <article className="space-y-4 rounded-2xl border bg-card/85 p-5 backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={deal.href} className="group inline-flex items-center gap-1 text-lg font-semibold hover:underline">
            <span className="truncate">{deal.name}</span>
            <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {[deal.customer, deal.stage, money(deal.value), deal.close_date && `close ${deal.close_date}`, showOwner && deal.owner]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Severity level={deal.severity === 'ok' ? 'ok' : deal.severity}>
          {deal.severity === 'ok' ? 'On track' : `${deal.severity} risk`}
        </Severity>
      </header>
      {deal.insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues found by the current rules.</p>
      ) : (
        <ul className="space-y-3">
          {deal.insights.map((i) => (
            <InsightRow key={i.rule} insight={i} />
          ))}
        </ul>
      )}
    </article>
  )
}

function InsightRow({ insight }: { insight: Insight }) {
  const { open } = useAiCopilot()
  const a = insight.suggested_action
  return (
    <li className="space-y-1.5 border-t pt-3 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Severity level={insight.severity}>{insight.severity === 'info' ? 'signal' : insight.severity}</Severity>
          <div>
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="text-xs text-muted-foreground">{insight.explanation}</p>
          </div>
        </div>
        {a.href ? (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to={a.href}>{a.label}</Link>
          </Button>
        ) : a.prompt ? (
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => open({ prompt: a.prompt })}>
            <Sparkles className="size-3.5" /> {a.label}
          </Button>
        ) : null}
      </div>
      <Why evidence={insight.evidence} source={insight.source} />
    </li>
  )
}

function TeamTable({ rows }: { rows: NonNullable<Awaited<ReturnType<typeof intelApi.deals>>['team']> }) {
  const cols = [
    ['open', 'Open'],
    ['value', 'Pipeline'],
    ['overdue_close', 'Past close date'],
    ['no_next_step', 'No next step'],
    ['stale', 'Stale 30d+'],
    ['large', 'Large deals'],
    ['overdue_tasks', 'Overdue tasks'],
  ] as const
  return (
    <section className="overflow-x-auto rounded-2xl border bg-card/85 backdrop-blur">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="px-5 pt-4 text-left font-semibold">Team inspection</caption>
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3 font-medium">Owner</th>
            {cols.map(([, label]) => (
              <th key={label} className="px-3 py-3 text-right font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.owner} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-5 py-2.5 font-medium">{r.owner}</td>
              {cols.map(([key]) => (
                <td
                  key={key}
                  className={cn(
                    'px-3 py-2.5 text-right tabular-nums',
                    ['overdue_close', 'no_next_step', 'stale', 'overdue_tasks'].includes(key) && r[key] > 0 && 'font-semibold text-amber-600 dark:text-amber-400',
                  )}
                >
                  {key === 'value' ? money(r.value) : r[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
