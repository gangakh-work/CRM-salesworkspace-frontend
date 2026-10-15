import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/features/auth/hooks/useUser'
import { agentApi } from '@/features/sales-agent/api/agentApi'
import { ApprovalInbox } from '@/features/sales-agent/components/ApprovalInbox'
import { CampaignsPanel } from '@/features/sales-agent/components/CampaignsPanel'
import { ActivityPanel, SettingsPanel } from '@/features/sales-agent/components/SettingsPanels'
import { cn } from '@/lib/utils'

/**
 * Autonomous sales agent: prospects your Dynamics 365 leads with personalised
 * sequences, handles replies and books meetings — inside your guardrails.
 */
export function SalesAgentPage() {
  const { email, displayName } = useUser()
  const qc = useQueryClient()
  const [tab, setTab] = useState('inbox')

  const overview = useQuery({
    queryKey: ['autopilot', 'overview', email],
    queryFn: () => agentApi.overview(email, displayName),
    enabled: Boolean(email),
    refetchInterval: 30_000,
  })
  const refresh = () => void qc.invalidateQueries({ queryKey: ['autopilot'] })

  const update = useMutation({
    mutationFn: (changes: Parameters<typeof agentApi.updateProfile>[2]) => agentApi.updateProfile(email, displayName, changes),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  })
  const run = useMutation({
    mutationFn: () => agentApi.run(email),
    onSuccess: (r) => {
      toast.success(
        `Cycle complete · ${r.planned} drafted · ${r.done} done · ${r.replies} repl${r.replies === 1 ? 'y' : 'ies'} read` +
          (r.deferred ? ` · ${r.deferred} waiting (limit/hours)` : '') +
          (r.failed ? ` · ${r.failed} failed` : ''),
      )
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (overview.isLoading) {
    return <div className="mx-auto max-w-[1400px] space-y-6 py-6"><div className="h-48 animate-pulse rounded-2xl bg-muted/40" /></div>
  }
  if (overview.isError || !overview.data) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-destructive/30 p-6 text-sm">
        Couldn't reach the sales agent service. {(overview.error as Error | null)?.message}
        <Button variant="link" onClick={() => void overview.refetch()}>Try again</Button>
      </div>
    )
  }

  const { profile, delivery, kpis, working_now } = overview.data
  const kpiItems = [
    { label: 'Awaiting you', value: kpis.pending_approval, accent: kpis.pending_approval > 0, onClick: () => setTab('inbox') },
    { label: `Sent today / ${kpis.daily_limit}`, value: kpis.sent_today },
    { label: `Replies · 7d (${kpis.reply_rate_7d}%)`, value: kpis.replies_7d },
    { label: 'Meetings · 30d', value: kpis.meetings_30d },
    { label: 'Active prospects', value: kpis.active_prospects },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-10 pb-16 pt-4">
      <header className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/80 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <Sparkles className="size-3.5" /> AI Sales Agent
          </span>
          <span className="flex items-center gap-2 normal-case tracking-normal">
            <span className={cn('size-2 rounded-full', profile.enabled ? 'bg-emerald-500' : 'bg-muted-foreground')} />
            {profile.enabled ? (working_now ? 'Working now' : 'On · outside working hours') : 'Paused'}
          </span>
        </div>

        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.9] tracking-[-0.04em]">{profile.persona_name}.</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Researches your leads, writes personalised outreach, follows up, reads replies and books meetings — and
              asks before anything leaves your mailbox.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border p-1" role="radiogroup" aria-label="Mode">
              {(['approval', 'autopilot'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={profile.mode === m}
                  onClick={() => update.mutate({ mode: m })}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    profile.mode === m ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
              <Switch checked={profile.enabled} onCheckedChange={(v) => update.mutate({ enabled: v })} aria-label="Agent on" />
              {profile.enabled ? 'On' : 'Off'}
            </label>
            <Button className="rounded-full" onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run now
            </Button>
          </div>
        </div>

        {delivery.mode === 'dry_run' ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <span>
              <strong>Dry run.</strong> Nothing is sent to prospects — emails and meetings are simulated so you can
              review the agent safely. An admin enables real Outlook delivery in the server settings.
            </span>
          </p>
        ) : !delivery.ready ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{delivery.detail}</p>
        ) : (
          <Badge variant="success" className="font-normal">Live · sending from your Outlook mailbox</Badge>
        )}
        {profile.mode === 'autopilot' && (
          <p className="text-sm text-muted-foreground">
            Autopilot: follow-ups, meeting proposals and bookings the prospect asked for run on their own
            {profile.approve_first_touch ? '; first emails still wait for your approval' : ''}.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-5">
          {kpiItems.map((k) => (
            <div key={k.label} className="bg-card/90 p-4 backdrop-blur">
              <dt className="text-xs text-muted-foreground">{k.label}</dt>
              <dd>
                <button
                  type="button"
                  onClick={k.onClick}
                  disabled={!k.onClick}
                  className={cn('mt-1 text-4xl font-bold tabular-nums tracking-tight', k.accent && 'text-amber-500')}
                >
                  {k.value}
                </button>
              </dd>
            </div>
          ))}
        </dl>
        {kpis.failed > 0 && (
          <p className="text-sm text-destructive">{kpis.failed} action(s) failed after retries — see Recent work in the inbox.</p>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox{kpis.pending_approval ? ` (${kpis.pending_approval})` : ''}</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="pt-6">
          <TabsContent value="inbox"><ApprovalInbox email={email} onChanged={refresh} /></TabsContent>
          <TabsContent value="campaigns"><CampaignsPanel email={email} onChanged={refresh} /></TabsContent>
          <TabsContent value="activity"><ActivityPanel email={email} /></TabsContent>
          <TabsContent value="settings">
            <SettingsPanel key={JSON.stringify(profile)} email={email} name={displayName} overview={overview.data} onChanged={refresh} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
