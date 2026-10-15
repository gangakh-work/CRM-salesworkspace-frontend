import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarCheck, Check, CircleSlash, Inbox, Loader2, Mail, MessageSquareReply, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { agentApi, type AgentAction } from '@/features/sales-agent/api/agentApi'
import { cn } from '@/lib/utils'

const KIND = {
  send_email: { icon: Mail, label: 'Outreach email' },
  reply_email: { icon: MessageSquareReply, label: 'Reply' },
  schedule_meeting: { icon: CalendarCheck, label: 'Meeting' },
  review_reply: { icon: Inbox, label: 'Needs you' },
} as const

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  done: 'success',
  approved: 'info',
  executing: 'info',
  failed: 'error',
  rejected: 'neutral',
  skipped: 'neutral',
  pending_approval: 'warning',
}

export function ApprovalInbox({ email, onChanged }: { email: string; onChanged: () => void }) {
  const qc = useQueryClient()
  const pending = useQuery({
    queryKey: ['autopilot', 'actions', email, 'pending'],
    queryFn: () => agentApi.actions(email, 'pending_approval'),
    refetchInterval: 30_000,
  })
  const recent = useQuery({
    queryKey: ['autopilot', 'actions', email, 'recent'],
    queryFn: () => agentApi.actions(email, 'approved,executing,done,failed,skipped,rejected'),
    refetchInterval: 30_000,
  })
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['autopilot'] })
    onChanged()
  }
  const approveAll = useMutation({
    mutationFn: () => agentApi.approveAll(email),
    onSuccess: (r) => {
      toast.success(`Approved ${r.approved} item(s). They'll go out within working hours.`)
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = pending.data ?? []
  const sendable = items.filter((a) => a.kind !== 'review_reply').length

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Waiting for you</h2>
            <p className="text-sm text-muted-foreground">
              Nothing below reaches a prospect until you approve it.
            </p>
          </div>
          {sendable > 1 && (
            <Button variant="outline" size="sm" onClick={() => approveAll.mutate()} disabled={approveAll.isPending}>
              {approveAll.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Approve all {sendable}
            </Button>
          )}
        </div>

        {pending.isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
        ) : pending.isError ? (
          <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
            {(pending.error as Error).message}
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Inbox className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="font-medium">You're all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">New drafts appear here as prospects become due.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((a) => (
              <ActionCard key={a.id} action={a} email={email} onDone={refresh} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Recent work</h2>
        {(recent.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card/60">
            {(recent.data ?? []).slice(0, 25).map((a) => {
              const Icon = KIND[a.kind]?.icon ?? Mail
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.error ||
                        (a.result.join_url ? 'Teams link created' : a.payload.subject) ||
                        a.reason}
                    </p>
                  </div>
                  {a.result.simulated && (
                    <Badge variant="outline" className="shrink-0 font-normal">
                      simulated
                    </Badge>
                  )}
                  <Badge variant={STATUS_TONE[a.status] ?? 'neutral'} className="shrink-0 font-normal capitalize">
                    {a.status === 'approved' ? 'queued' : a.status.replace('_', ' ')}
                  </Badge>
                  <span className="hidden w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                    {a.executed_at || a.created_at ? format(new Date((a.executed_at || a.created_at)!), 'd MMM, HH:mm') : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function ActionCard({ action, email, onDone }: { action: AgentAction; email: string; onDone: () => void }) {
  const [subject, setSubject] = useState(action.payload.subject ?? '')
  const [body, setBody] = useState(action.payload.body ?? '')
  const [slot, setSlot] = useState(() => Math.max(0, (action.payload.slots ?? []).indexOf(action.payload.start ?? '')))
  const edited = subject !== (action.payload.subject ?? '') || body !== (action.payload.body ?? '')
  const isEmail = action.kind === 'send_email' || action.kind === 'reply_email'
  const Icon = KIND[action.kind]?.icon ?? Mail

  const run = useMutation({
    mutationFn: async (what: 'approve' | 'skip' | 'stop' | 'ack') => {
      if (what === 'approve') {
        const edits = isEmail && edited ? { subject, body } : action.kind === 'schedule_meeting' ? { slot_index: slot } : undefined
        return agentApi.approve(email, action.id, edits)
      }
      if (what === 'ack') return agentApi.acknowledge(email, action.id)
      return agentApi.reject(email, action.id, what === 'stop')
    },
    onSuccess: (_, what) => {
      toast.success(
        what === 'approve' ? 'Approved — it will go out within working hours.' : what === 'ack' ? 'Marked as handled.' : 'Skipped.',
      )
      onDone()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <article className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur">
      <header className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{action.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[action.lead?.company, action.lead?.email, action.reason].filter(Boolean).join(' · ')}
          </p>
        </div>
        {action.payload.draft_source === 'template' && (
          <Badge variant="outline" className="font-normal" title="AI unavailable — a safe template was used">
            template
          </Badge>
        )}
        <Badge variant="outline" className="font-normal">
          {KIND[action.kind]?.label}
        </Badge>
      </header>

      <div className="space-y-4 px-5 py-4">
        {isEmail && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`subj-${action.id}`} className="text-xs uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <Input id={`subj-${action.id}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`body-${action.id}`} className="text-xs uppercase tracking-wider text-muted-foreground">
                Message
              </Label>
              <Textarea
                id={`body-${action.id}`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={Math.min(14, Math.max(6, body.split('\n').length + 1))}
                className="font-[inherit] leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">Your signature and an opt-out line are added automatically.</p>
            </div>
          </>
        )}

        {action.kind === 'schedule_meeting' && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm">Send a Teams invite to {action.lead?.name || action.payload.to} for:</legend>
            {(action.payload.slots ?? []).map((s, i) => (
              <label
                key={s}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors',
                  slot === i ? 'border-primary bg-primary/10' : 'hover:bg-muted/40',
                )}
              >
                <input type="radio" name={`slot-${action.id}`} checked={slot === i} onChange={() => setSlot(i)} />
                {format(new Date(s), "EEEE d MMMM 'at' HH:mm")}
                {s === action.payload.start && <span className="text-xs text-muted-foreground">(prospect's choice)</span>}
              </label>
            ))}
          </fieldset>
        )}

        {action.kind === 'review_reply' && (
          <blockquote className="whitespace-pre-wrap rounded-xl border-l-4 border-primary/60 bg-muted/30 px-4 py-3 text-sm">
            {action.payload.preview}
          </blockquote>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
        {action.kind === 'review_reply' ? (
          <Button size="sm" onClick={() => run.mutate('ack')} disabled={run.isPending}>
            <Check className="size-4" /> Mark handled
          </Button>
        ) : (
          <>
            {action.kind === 'send_email' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => run.mutate('stop')} disabled={run.isPending}>
                  <CircleSlash className="size-4" /> Stop sequence
                </Button>
                <Button variant="outline" size="sm" onClick={() => run.mutate('skip')} disabled={run.isPending}>
                  <SkipForward className="size-4" /> Skip step
                </Button>
              </>
            )}
            {action.kind !== 'send_email' && (
              <Button variant="outline" size="sm" onClick={() => run.mutate('skip')} disabled={run.isPending}>
                Dismiss
              </Button>
            )}
            <Button size="sm" onClick={() => run.mutate('approve')} disabled={run.isPending || (isEmail && (!subject.trim() || body.trim().length < 10))}>
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {action.kind === 'schedule_meeting' ? 'Approve & book' : edited ? 'Save & approve' : 'Approve & send'}
            </Button>
          </>
        )}
      </footer>
    </article>
  )
}
