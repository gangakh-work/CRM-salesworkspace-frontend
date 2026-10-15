import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Bot, CheckCircle2, CircleDashed, FlaskConical, MicOff, RefreshCw, TriangleAlert, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useUser } from '@/features/auth/hooks/useUser'
import { intelApi } from '@/features/intelligence/api/intelApi'
import { LoadState, PageHeader } from '@/features/intelligence/components/IntelUi'
import { cn } from '@/lib/utils'

const STATUS = {
  connected: { label: 'Connected', icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' },
  configured: { label: 'Configured', icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' },
  running: { label: 'Running', icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' },
  simulated: { label: 'Simulated', icon: FlaskConical, cls: 'text-amber-600 dark:text-amber-400' },
  development: { label: 'Development mode', icon: TriangleAlert, cls: 'text-amber-600 dark:text-amber-400' },
  disabled: { label: 'Disabled', icon: CircleDashed, cls: 'text-muted-foreground' },
  not_connected: { label: 'Not connected', icon: CircleDashed, cls: 'text-muted-foreground' },
  error: { label: 'Error', icon: TriangleAlert, cls: 'text-destructive' },
} as const

export function IntegrationsAuditPage() {
  const { email, displayName } = useUser()
  const status = useQuery({ queryKey: ['intel', 'system', email], queryFn: () => intelApi.system(email, displayName), enabled: Boolean(email) })
  const audit = useQuery({ queryKey: ['intel', 'audit', email], queryFn: () => intelApi.audit(email, displayName), enabled: Boolean(email) })

  return (
    <div className="mx-auto max-w-[1200px] space-y-10 pb-16 pt-4">
      <PageHeader
        eyebrow="Integrations & audit"
        title="Connections and history."
        subtitle="Live health of every system the workspace depends on, and a record of every change made through it. No credentials are ever shown here."
        actions={
          <Button variant="outline" size="sm" onClick={() => void status.refetch()} disabled={status.isFetching}>
            <RefreshCw className={cn('size-4', status.isFetching && 'animate-spin')} /> Re-check
          </Button>
        }
      />

      <LoadState isLoading={status.isLoading} error={status.error} onRetry={() => void status.refetch()}>
        <div className="grid gap-3 md:grid-cols-2">
          {status.data?.integrations.map((i) => {
            const s = STATUS[i.status as keyof typeof STATUS] ?? STATUS.not_connected
            const Icon = s.icon
            return (
              <article key={i.id} className="flex gap-3 rounded-2xl border bg-card/85 p-4 backdrop-blur">
                <Icon className={cn('mt-0.5 size-5 shrink-0', s.cls)} aria-hidden />
                <div className="min-w-0 space-y-1">
                  <h2 className="font-semibold">{i.name}</h2>
                  <p className={cn('text-sm font-medium', s.cls)}>
                    {s.label}
                    {i.latency_ms !== undefined && <span className="font-normal text-muted-foreground"> · {i.latency_ms} ms</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{i.error || i.detail}</p>
                </div>
              </article>
            )
          })}
        </div>
        {status.data && (
          <p className="text-xs text-muted-foreground">Checked at {format(new Date(status.data.checked_at), 'HH:mm:ss')}</p>
        )}
      </LoadState>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Audit log</h2>
        <LoadState
          isLoading={audit.isLoading}
          error={audit.error}
          onRetry={() => void audit.refetch()}
          empty={(audit.data ?? []).length === 0}
          emptyText="No recorded actions yet."
        >
          <ol className="divide-y rounded-2xl border bg-card/85 backdrop-blur">
            {(audit.data ?? []).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 text-muted-foreground">
                  {a.actor === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actor === 'user' ? 'You' : 'AI agent'} · {a.event.replace(/_/g, ' ')}
                  </p>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground" dateTime={a.at}>
                  {format(new Date(a.at), 'd MMM, HH:mm')}
                </time>
              </li>
            ))}
          </ol>
        </LoadState>
      </section>
    </div>
  )
}

export function ConversationInsightsPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-8 pb-16 pt-4">
      <PageHeader
        eyebrow="Conversation insights"
        title="Not connected yet."
        subtitle="Call summaries, objections, competitor mentions and commitments need real recordings or transcripts. None is connected, so nothing is shown — the workspace never simulates conversation data."
      />
      <section className="space-y-4 rounded-2xl border border-dashed p-8">
        <MicOff className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">What enabling this needs</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>A recording or transcript source — e.g. Microsoft Teams meeting transcripts via Graph (OnlineMeetingTranscript.Read.All) or a call-recording provider.</li>
          <li>Participant consent and a retention policy agreed with your compliance team.</li>
          <li>Access rules so people only see conversations they were part of or are permitted to review.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Once a source is connected, transcripts can be summarised, commitments turned into follow-up tasks and
          insights linked to the right lead or opportunity.
        </p>
      </section>
    </div>
  )
}
