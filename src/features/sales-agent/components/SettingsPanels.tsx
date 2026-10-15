import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Bot, Loader2, Save, ShieldOff, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { agentApi, type AgentOverview, type AgentProfile } from '@/features/sales-agent/api/agentApi'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function SettingsPanel({
  email,
  name,
  overview,
  onChanged,
}: {
  email: string
  name: string
  overview: AgentOverview
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<AgentProfile>(overview.profile)
  const set = <K extends keyof AgentProfile>(key: K, value: AgentProfile[K]) => setForm((f) => ({ ...f, [key]: value }))
  const days = new Set(form.work_days.split(',').filter(Boolean).map(Number))

  const changes = (Object.keys(form) as (keyof AgentProfile)[]).reduce<Partial<AgentProfile>>((acc, k) => {
    if (k !== 'owner_email' && k !== 'owner_name' && form[k] !== overview.profile[k]) (acc as Record<string, unknown>)[k] = form[k]
    return acc
  }, {})
  const dirty = Object.keys(changes).length > 0

  const save = useMutation({
    mutationFn: () => agentApi.updateProfile(email, name, changes),
    onSuccess: () => {
      toast.success('Settings saved')
      void qc.invalidateQueries({ queryKey: ['autopilot'] })
      onChanged()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6 rounded-2xl border bg-card/80 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight">How your agent works</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Agent name" id="p-name">
            <Input id="p-name" value={form.persona_name} onChange={(e) => set('persona_name', e.target.value)} />
          </Field>
          <Field label="Tone" id="p-tone">
            <Input id="p-tone" value={form.tone} onChange={(e) => set('tone', e.target.value)} />
          </Field>
        </div>
        <Field label="What you offer (used to personalise emails)" id="p-vp">
          <Textarea
            id="p-vp"
            rows={3}
            value={form.value_proposition}
            onChange={(e) => set('value_proposition', e.target.value)}
            placeholder="e.g. We help manufacturers cut quoting time in half with AI-assisted CPQ."
          />
        </Field>
        <Field label="Email signature" id="p-sig">
          <Textarea id="p-sig" rows={3} value={form.signature} onChange={(e) => set('signature', e.target.value)} />
        </Field>

        <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Guardrails</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Emails per day" id="p-limit">
            <Input id="p-limit" type="number" min={1} value={form.daily_email_limit}
              onChange={(e) => set('daily_email_limit', Number(e.target.value) || 1)} />
          </Field>
          <Field label="Working hours" id="p-start">
            <div className="flex items-center gap-2">
              <Input id="p-start" type="number" min={0} max={23} value={form.work_start_hour}
                onChange={(e) => set('work_start_hour', Number(e.target.value))} aria-label="Start hour" />
              <span className="text-muted-foreground">–</span>
              <Input type="number" min={1} max={24} value={form.work_end_hour}
                onChange={(e) => set('work_end_hour', Number(e.target.value))} aria-label="End hour" />
            </div>
          </Field>
          <Field label="Time zone" id="p-tz">
            <Input id="p-tz" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Europe/London" />
          </Field>
        </div>
        <div className="space-y-1.5">
          <Label>Working days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={days.has(i)}
                onClick={() => {
                  const next = new Set(days)
                  if (next.has(i)) next.delete(i)
                  else next.add(i)
                  set('work_days', [...next].sort().join(','))
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  days.has(i) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted/50',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Meeting length" id="p-min">
            <select
              id="p-min"
              value={form.meeting_minutes}
              onChange={(e) => set('meeting_minutes', Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {[15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
            <span>
              <span className="block font-medium">Review first emails</span>
              <span className="text-xs text-muted-foreground">Even in autopilot, first touches wait for you</span>
            </span>
            <Switch checked={form.approve_first_touch} onCheckedChange={(v) => set('approve_first_touch', v)} />
          </label>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
          </Button>
        </div>
      </section>

      <div className="space-y-6">
        <section className="space-y-3 rounded-2xl border bg-card/80 p-6 backdrop-blur">
          <h3 className="font-semibold">Delivery</h3>
          <p className="text-sm text-muted-foreground">{overview.delivery.detail}</p>
          {overview.delivery.mode === 'dry_run' && (
            <p className="text-xs text-muted-foreground">
              To send real email from Outlook, an admin sets <code>AGENT_DELIVERY_MODE=graph</code> and grants the app
              Mail.Send, Mail.ReadWrite and Calendars.ReadWrite.
            </p>
          )}
        </section>
        <DoNotContact email={email} />
        {overview.delivery.mode === 'dry_run' && <SimulateReply email={email} onDone={onChanged} />}
      </div>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function DoNotContact({ email }: { email: string }) {
  const [target, setTarget] = useState('')
  const add = useMutation({
    mutationFn: () => agentApi.suppress(email, target),
    onSuccess: () => {
      toast.success(`${target} will never be contacted by the agent`)
      setTarget('')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <section className="space-y-3 rounded-2xl border bg-card/80 p-6 backdrop-blur">
      <h3 className="flex items-center gap-2 font-semibold">
        <ShieldOff className="size-4" /> Do-not-contact
      </h3>
      <p className="text-sm text-muted-foreground">
        People who reply “unsubscribe” are added automatically. Add anyone else here.
      </p>
      <div className="flex gap-2">
        <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="name@company.com" aria-label="Email to block" />
        <Button variant="outline" onClick={() => add.mutate()} disabled={!target.includes('@') || add.isPending}>
          Add
        </Button>
      </div>
    </section>
  )
}

function SimulateReply({ email, onDone }: { email: string; onDone: () => void }) {
  const qc = useQueryClient()
  const [prospect, setProspect] = useState('')
  const [text, setText] = useState("Sounds interesting — let's schedule a call.")
  const sim = useMutation({
    mutationFn: () => agentApi.simulateReply(email, prospect, text),
    onSuccess: (r) => {
      toast.success(r.handled ? 'Reply processed — check the inbox' : 'No matching conversation')
      void qc.invalidateQueries({ queryKey: ['autopilot'] })
      onDone()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <section className="space-y-3 rounded-2xl border border-dashed p-6">
      <h3 className="font-semibold">Test a prospect reply</h3>
      <p className="text-sm text-muted-foreground">Dry run only. Pretend a prospect answered an email the agent sent.</p>
      <Input value={prospect} onChange={(e) => setProspect(e.target.value)} placeholder="prospect@company.com" aria-label="Prospect email" />
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply text" />
      <div className="flex flex-wrap gap-2 text-xs">
        {["Let's schedule a call", 'Option 2 works', 'Not interested, thanks', 'Please unsubscribe me', 'Out of office until Monday', 'What does pricing look like?'].map((t) => (
          <button key={t} type="button" className="rounded-full border px-2.5 py-1 hover:bg-muted/50" onClick={() => setText(t)}>
            {t}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => sim.mutate()} disabled={!prospect.includes('@') || sim.isPending}>
        Simulate reply
      </Button>
    </section>
  )
}

export function ActivityPanel({ email }: { email: string }) {
  const activity = useQuery({
    queryKey: ['autopilot', 'activity', email],
    queryFn: () => agentApi.activity(email),
    refetchInterval: 30_000,
  })
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
        <p className="text-sm text-muted-foreground">Every decision and action, by the agent or by you.</p>
      </div>
      {(activity.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="relative space-y-1 border-l pl-6">
          {(activity.data ?? []).map((item) => (
            <li key={item.id} className="relative py-2">
              <span
                className={cn(
                  'absolute -left-[33px] top-2.5 flex size-5 items-center justify-center rounded-full border bg-background',
                  item.actor === 'user' ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.actor === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
              </span>
              <p className="text-sm">{item.summary}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{format(new Date(item.at), 'd MMM yyyy, HH:mm')}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
