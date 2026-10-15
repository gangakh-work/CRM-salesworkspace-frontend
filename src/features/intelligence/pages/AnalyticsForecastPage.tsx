import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Info } from 'lucide-react'
import { useState } from 'react'

import { useUser } from '@/features/auth/hooks/useUser'
import { intelApi, type AnalyticsResponse } from '@/features/intelligence/api/intelApi'
import { LoadState, PageHeader } from '@/features/intelligence/components/IntelUi'
import { money } from '@/features/intelligence/lib/money'
import { cn } from '@/lib/utils'

const PERIODS = [30, 90, 180, 365] as const

export function AnalyticsForecastPage() {
  const { email, displayName } = useUser()
  const [days, setDays] = useState<number>(90)
  const [scope, setScope] = useState<'mine' | 'team'>('mine')
  const [owner, setOwner] = useState('')
  const end = format(new Date(), 'yyyy-MM-dd')
  const start = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const q = useQuery({
    queryKey: ['intel', 'analytics', email, start, end, scope, owner],
    queryFn: () => intelApi.analytics(email, displayName, { start, end, scope, owner: scope === 'team' ? owner : undefined }),
    enabled: Boolean(email),
  })
  const data = q.data

  return (
    <div className="mx-auto max-w-[1300px] space-y-8 pb-16 pt-4">
      <PageHeader
        eyebrow="Analytics & forecast"
        title="Pipeline, by the numbers."
        subtitle="Calculated directly from Dynamics 365 records. Hover any figure for its definition."
        actions={
          <>
            <div className="flex rounded-full border p-1" role="radiogroup" aria-label="Period">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={days === p}
                  onClick={() => setDays(p)}
                  className={cn('rounded-full px-3 py-1 text-sm', days === p ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
                >
                  {p === 365 ? '12 months' : `${p} days`}
                </button>
              ))}
            </div>
            {data?.can_view_team && (
              <select
                aria-label="Scope"
                value={scope === 'mine' ? 'mine' : owner || 'team'}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'mine') {
                    setScope('mine')
                    setOwner('')
                  } else {
                    setScope('team')
                    setOwner(v === 'team' ? '' : v)
                  }
                }}
                className="h-9 rounded-full border border-input bg-background px-3 text-sm"
              >
                <option value="mine">My pipeline</option>
                <option value="team">Whole team</option>
                {data.owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
          </>
        }
      />

      <LoadState isLoading={q.isLoading} error={q.error} onRetry={() => void q.refetch()}>
        {data && <AnalyticsBody data={data} />}
      </LoadState>
    </div>
  )
}

function Kpi({ label, value, definition, sub }: { label: string; value: string; definition: string; sub?: string }) {
  return (
    <div className="group relative bg-card/90 p-4 backdrop-blur" tabIndex={0} aria-describedby={undefined}>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {label} <Info className="size-3 opacity-50" aria-hidden />
      </dt>
      <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</dd>
      {sub && <dd className="text-xs text-muted-foreground">{sub}</dd>}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-3 right-3 top-full z-20 mt-1 rounded-lg border bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {definition}
      </div>
    </div>
  )
}

function Bars({ rows, max, format: fmt }: { rows: { label: string; value: number; note?: string }[]; max: number; format: (v: number) => string }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground" title={r.label}>
            {r.label}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (100 * r.value) / max : 0}%` }} />
          </span>
          <span className="w-24 text-right tabular-nums">
            {fmt(r.value)}
            {r.note && <span className="ml-1 text-xs text-muted-foreground">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function AnalyticsBody({ data }: { data: AnalyticsResponse }) {
  const k = data.kpis
  const d = data.definitions
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`)
  const fMax = Math.max(1, ...data.forecast.map((m) => Math.max(m.pipeline, m.weighted, m.won)))

  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 gap-px overflow-visible rounded-2xl border bg-border md:grid-cols-4">
        <Kpi label="Open pipeline" value={money(k.open_pipeline)} sub={`${k.open_count} open deals`} definition={d.open_pipeline} />
        <Kpi
          label="Weighted pipeline"
          value={money(k.weighted_pipeline)}
          sub={k.without_probability ? `${k.without_probability} without probability` : undefined}
          definition={d.weighted_pipeline}
        />
        <Kpi label="Win rate" value={pct(k.win_rate)} sub={`${k.won_count} won · ${k.lost_count} lost`} definition={d.win_rate} />
        <Kpi label="Won revenue" value={money(k.won_value)} definition={d.won} />
        <Kpi
          label="Sales cycle"
          value={k.sales_cycle_days === null ? '—' : `${k.sales_cycle_days} d`}
          definition={d.sales_cycle}
        />
        <Kpi label="Lost revenue" value={money(k.lost_value)} definition={d.lost} />
        <Kpi
          label="Task completion"
          value={pct(k.task_completion)}
          sub={`${k.tasks_in_period} tasks due in period`}
          definition={d.task_completion}
        />
        <Kpi label="Overdue tasks" value={String(k.overdue_tasks)} definition={d.overdue_tasks} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-card/85 p-5 backdrop-blur">
          <h2 className="font-semibold">Open pipeline by stage</h2>
          {data.stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open opportunities.</p>
          ) : (
            <Bars
              rows={data.stages.map((s) => ({ label: s.stage, value: s.value, note: `(${s.count})` }))}
              max={Math.max(...data.stages.map((s) => s.value))}
              format={money}
            />
          )}
        </section>
        <section className="space-y-4 rounded-2xl border bg-card/85 p-5 backdrop-blur">
          <h2 className="font-semibold">Open opportunity age</h2>
          <Bars
            rows={data.aging.map((a) => ({ label: a.bucket, value: a.count }))}
            max={Math.max(1, ...data.aging.map((a) => a.count))}
            format={(v) => `${v}`}
          />
          <p className="text-xs text-muted-foreground">Days since the opportunity was created.</p>
        </section>
      </div>

      <section className="space-y-5 rounded-2xl border bg-card/85 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Forecast — next 6 months</h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Legend className="bg-muted-foreground/40" label="Pipeline" />
            <Legend className="bg-primary" label="Weighted" />
            <Legend className="bg-emerald-500" label="Won" />
          </div>
        </div>
        <div className="flex h-48 items-end gap-3" aria-hidden>
          {data.forecast.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                {[
                  [m.pipeline, 'bg-muted-foreground/40'],
                  [m.weighted, 'bg-primary'],
                  [m.won, 'bg-emerald-500'],
                ].map(([v, cls], i) => (
                  <span key={i} className={cn('w-1/4 rounded-t', cls as string)} style={{ height: `${(100 * (v as number)) / fMax}%` }} />
                ))}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{format(new Date(`${m.month}-01`), 'MMM')}</span>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 text-right font-medium">Deals</th>
                <th className="py-2 text-right font-medium">Pipeline</th>
                <th className="py-2 text-right font-medium">Weighted</th>
                <th className="py-2 text-right font-medium">Won</th>
              </tr>
            </thead>
            <tbody>
              {data.forecast.map((m) => (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-2">{format(new Date(`${m.month}-01`), 'MMMM yyyy')}</td>
                  <td className="py-2 text-right tabular-nums">{m.count}</td>
                  <td className="py-2 text-right tabular-nums">{money(m.pipeline)}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{money(m.weighted)}</td>
                  <td className="py-2 text-right tabular-nums">{money(m.won)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-1 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Assumptions</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {data.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        {data.period.start} – {data.period.end} · {data.scope === 'team' ? data.owner || 'whole team' : 'your records'} ·{' '}
        {data.record_counts.opportunities} opportunities and {data.record_counts.tasks} tasks read at{' '}
        {format(new Date(data.generated_at), 'HH:mm')}
      </p>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-sm', className)} /> {label}
    </span>
  )
}
