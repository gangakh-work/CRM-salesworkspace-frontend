import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pause, Play, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { agentApi, type Campaign, type CampaignStep } from '@/features/sales-agent/api/agentApi'

const STATUS_VARIANT = { draft: 'outline', active: 'success', paused: 'warning', completed: 'neutral' } as const

const DEFAULT_STEPS: CampaignStep[] = [
  { day: 0, channel: 'email', instructions: 'First touch: reference their role/company, one clear question.' },
  { day: 3, channel: 'email', instructions: 'Follow-up: add one new, relevant angle; keep it short.' },
  { day: 7, channel: 'email', instructions: 'Final note: polite close, leave the door open.' },
]

export function CampaignsPanel({ email, onChanged }: { email: string; onChanged: () => void }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const campaigns = useQuery({ queryKey: ['autopilot', 'campaigns', email], queryFn: () => agentApi.campaigns(email) })
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['autopilot'] })
    onChanged()
  }
  const act = useMutation({
    mutationFn: ({ id, what }: { id: number; what: 'activate' | 'paused' | 'completed' }) =>
      what === 'activate' ? agentApi.activate(email, id) : agentApi.setStatus(email, id, what),
    onSuccess: (c, { what }) => {
      toast.success(
        what === 'activate'
          ? `“${c.name}” is live · ${c.stats.enrolled} prospect(s) enrolled`
          : `“${c.name}” ${what}`,
      )
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Who the agent contacts, and what it says at each step.</p>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New campaign
          </Button>
        )}
      </div>

      {creating && (
        <CampaignBuilder
          email={email}
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            refresh()
          }}
        />
      )}

      {campaigns.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
      ) : (campaigns.data ?? []).length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one to have the agent start reaching out to your leads.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(campaigns.data ?? []).map((c) => (
            <CampaignCard key={c.id} c={c} busy={act.isPending} onAct={(what) => act.mutate({ id: c.id, what })} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ c, busy, onAct }: { c: Campaign; busy: boolean; onAct: (what: 'activate' | 'paused' | 'completed') => void }) {
  const stats = [
    ['Enrolled', c.stats.enrolled],
    ['Sent', c.stats.sent],
    ['Replied', c.stats.replied],
    ['Meetings', c.stats.meetings],
  ] as const
  return (
    <article className="space-y-4 rounded-2xl border bg-card/80 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{c.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{c.goal}</p>
        </div>
        <Badge variant={STATUS_VARIANT[c.status]} className="shrink-0 font-normal capitalize">
          {c.status}
        </Badge>
      </div>
      <dl className="grid grid-cols-4 gap-2">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        {c.steps.length}-step sequence (days {c.steps.map((s) => s.day).join(', ')}) ·{' '}
        {c.audience.statuses.join(', ') || 'any status'}
        {c.audience.industries.length ? ` · ${c.audience.industries.join(', ')}` : ''}
        {c.audience.mine_only ? ' · my leads' : ''} · reply rate {c.stats.reply_rate}%
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        {c.status === 'active' ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onAct('paused')}>
            <Pause className="size-4" /> Pause
          </Button>
        ) : c.status !== 'completed' ? (
          <Button size="sm" disabled={busy} onClick={() => onAct('activate')}>
            <Play className="size-4" /> {c.status === 'draft' ? 'Activate' : 'Resume'}
          </Button>
        ) : null}
        {c.status !== 'completed' && c.status !== 'draft' && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onAct('completed')}>
            End campaign
          </Button>
        )}
      </div>
    </article>
  )
}

function CampaignBuilder({ email, onCancel, onCreated }: { email: string; onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('Book an introductory meeting')
  const [statuses, setStatuses] = useState<string[]>(['new', 'contacted'])
  const [industries, setIndustries] = useState('')
  const [mineOnly, setMineOnly] = useState(true)
  const [maxLeads, setMaxLeads] = useState(25)
  const [steps, setSteps] = useState<CampaignStep[]>(DEFAULT_STEPS)

  const create = useMutation({
    mutationFn: () =>
      agentApi.createCampaign(email, {
        name,
        goal,
        audience: {
          statuses,
          industries: industries.split(',').map((s) => s.trim()).filter(Boolean),
          mine_only: mineOnly,
          max_leads: maxLeads,
        },
        steps,
      }),
    onSuccess: (c) => {
      toast.success(`Campaign “${c.name}” saved as draft. Activate it to enrol prospects.`)
      onCreated()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const daysAscending = steps.every((s, i) => i === 0 || s.day >= steps[i - 1].day)
  const valid = name.trim() && statuses.length > 0 && daysAscending && steps.length > 0

  return (
    <section className="space-y-6 rounded-2xl border bg-card/90 p-6 backdrop-blur">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Campaign name *</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 manufacturing outreach" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-goal">Goal</Label>
          <Input id="c-goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Audience — from your Dynamics 365 leads</legend>
        <div className="flex flex-wrap gap-5">
          {(['new', 'contacted', 'qualified'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm capitalize">
              <Checkbox
                checked={statuses.includes(s)}
                onCheckedChange={(v) => setStatuses((cur) => (v ? [...cur, s] : cur.filter((x) => x !== s)))}
              />
              {s}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={mineOnly} onCheckedChange={setMineOnly} /> Only leads I own
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
          <div className="space-y-1.5">
            <Label htmlFor="c-ind">Industries (optional, comma separated)</Label>
            <Input id="c-ind" value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="Manufacturing, Retail" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-max">Max prospects</Label>
            <Input id="c-max" type="number" min={1} max={500} value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value) || 1)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leads without an email, disqualified leads, people on your do-not-contact list and anyone already in an
          open sequence are skipped automatically.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Sequence</legend>
        {steps.map((step, i) => (
          <div key={i} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[6.5rem_1fr_auto]">
            <div className="space-y-1">
              <Label htmlFor={`d-${i}`} className="text-xs text-muted-foreground">
                Step {i + 1} · day
              </Label>
              <Input
                id={`d-${i}`}
                type="number"
                min={0}
                value={step.day}
                onChange={(e) => setSteps((cur) => cur.map((s, j) => (j === i ? { ...s, day: Number(e.target.value) || 0 } : s)))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`in-${i}`} className="text-xs text-muted-foreground">
                What the agent should write
              </Label>
              <Textarea
                id={`in-${i}`}
                rows={2}
                value={step.instructions}
                onChange={(e) => setSteps((cur) => cur.map((s, j) => (j === i ? { ...s, instructions: e.target.value } : s)))}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="self-end"
              aria-label={`Remove step ${i + 1}`}
              disabled={steps.length === 1}
              onClick={() => setSteps((cur) => cur.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {!daysAscending && <p className="text-xs text-destructive">Step days must go up (e.g. 0, 3, 7).</p>}
        {steps.length < 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSteps((cur) => [...cur, { day: (cur.at(-1)?.day ?? 0) + 4, channel: 'email', instructions: '' }])}
          >
            <Plus className="size-4" /> Add step
          </Button>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => create.mutate()} disabled={!valid || create.isPending}>
          {create.isPending && <Loader2 className="size-4 animate-spin" />} Save campaign
        </Button>
      </div>
    </section>
  )
}
