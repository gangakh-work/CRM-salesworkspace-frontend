import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { BriefcaseBusiness, CalendarClock, Check, CheckSquare, Clock, Loader2, Sparkles, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { useUser } from '@/features/auth/hooks/useUser'
import { intelApi, type ActionRef, type WorkflowAction } from '@/features/intelligence/api/intelApi'
import { LoadState, PageHeader, Severity, Why } from '@/features/intelligence/components/IntelUi'
import { cn } from '@/lib/utils'

const TYPE_ICON = { task: CheckSquare, meeting: CalendarClock, deal: BriefcaseBusiness, lead: UserPlus } as const

export function MyWorkflowPage() {
  const { email, displayName } = useUser()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') ?? 'all'
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['intel', 'workflow', email, view],
    queryFn: () => intelApi.workflow(email, displayName, view),
    enabled: Boolean(email),
  })
  const refresh = () => void qc.invalidateQueries({ queryKey: ['intel', 'workflow'] })

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 pb-16 pt-4">
      <PageHeader
        eyebrow="My workflow"
        title="What to do next."
        subtitle="Your day as a ranked queue from Dynamics 365 tasks, meetings, deals and leads — each item says why it is here."
      />

      <nav className="flex flex-wrap gap-1.5" aria-label="Workflow views">
        {(q.data?.views ?? []).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setParams(v.id === 'all' ? {} : { view: v.id })}
            aria-pressed={view === v.id}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              view === v.id ? 'border-foreground bg-foreground text-background' : 'bg-card/60 hover:border-foreground/40',
            )}
          >
            {v.label} <span className="ml-1 tabular-nums opacity-60">{v.count}</span>
          </button>
        ))}
      </nav>

      <LoadState
        isLoading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        empty={q.data?.actions.length === 0}
        emptyText={view === 'completed' ? 'Nothing completed in the last 7 days.' : 'Nothing here — you are on top of it.'}
      >
        <ol className="space-y-3">
          {q.data?.actions.map((a, i) => (
            <ActionCard key={a.key} action={a} rank={i + 1} email={email} name={displayName} onDone={refresh} />
          ))}
        </ol>
      </LoadState>

      {q.data && (
        <footer className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <p>
            <strong className="font-semibold">How items are ranked:</strong> {q.data.ranking}
          </p>
          <p>
            Updated {format(new Date(q.data.generated_at), 'HH:mm')}
            {q.data.hidden ? ` · ${q.data.hidden} snoozed or dismissed` : ''}
          </p>
        </footer>
      )}
    </div>
  )
}

function ActionCard({
  action,
  rank,
  email,
  name,
  onDone,
}: {
  action: WorkflowAction
  rank: number
  email: string
  name: string
  onDone: () => void
}) {
  const navigate = useNavigate()
  const { open } = useAiCopilot()
  const [rescheduling, setRescheduling] = useState(false)
  const [due, setDue] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const Icon = TYPE_ICON[action.type] ?? CheckSquare
  const overdue = action.views.includes('overdue')

  const mutate = useMutation({
    mutationFn: async (op: { id: string; until?: string }) => {
      if (op.id === 'complete') return intelApi.completeTask(email, name, action.record.id)
      if (op.id === 'reschedule') return intelApi.rescheduleTask(email, name, action.record.id, due)
      if (op.id === 'snooze')
        return intelApi.setState(email, name, { key: action.key, status: 'snoozed', until: op.until })
      return intelApi.setState(email, name, { key: action.key, status: 'dismissed', fingerprint: action.fingerprint })
    },
    onSuccess: (_, op) => {
      toast.success(
        op.id === 'complete'
          ? 'Task completed in Dynamics 365'
          : op.id === 'reschedule'
            ? `Rescheduled to ${due}`
            : op.id === 'snooze'
              ? 'Snoozed'
              : 'Dismissed — it comes back if the record changes',
      )
      setRescheduling(false)
      onDone()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const run = (ref: ActionRef) => {
    if (ref.id === 'open' && ref.href) navigate(ref.href)
    else if (ref.id === 'prompt' && ref.prompt) open({ prompt: ref.prompt })
    else if (ref.id === 'reschedule') setRescheduling((v) => !v)
    else if (ref.id === 'snooze') mutate.mutate({ id: 'snooze', until: addDays(new Date(), 1).toISOString() })
    else mutate.mutate({ id: ref.id })
  }

  if (action.views.includes('completed') && action.score === 0) {
    return (
      <li className="flex items-center gap-3 rounded-2xl border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
        <Check className="size-4 text-emerald-500" /> <span className="line-through">{action.title}</span>
        {action.record.regarding && <span>· {action.record.regarding}</span>}
      </li>
    )
  }

  return (
    <li className="group rounded-2xl border bg-card/85 p-4 shadow-sm backdrop-blur transition-colors hover:border-foreground/30 md:p-5">
      <div className="flex gap-4">
        <span className="hidden w-6 shrink-0 pt-1 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
          {String(rank).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            overdue ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold leading-snug">{action.title}</h2>
              <p className={cn('text-sm', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                {action.reason}
              </p>
              {action.reasons.length > 1 && (
                <p className="text-xs text-muted-foreground">Also: {action.reasons.slice(1).join(' · ')}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {action.type === 'task' && (
                <Severity level={action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low'}>
                  {action.priority_label}
                </Severity>
              )}
              {action.due_date && (
                <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
                  <Clock className="size-3" /> {action.due_date}
                </span>
              )}
            </div>
          </div>
          {(action.record.regarding || action.record.href) && (
            <p className="text-xs text-muted-foreground">
              {action.record.regarding && <>Related: {action.record.regarding}</>}
            </p>
          )}
          <Why evidence={action.evidence} source={action.source} />

          {rescheduling && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
              <label htmlFor={`due-${action.key}`} className="text-sm">
                New due date
              </label>
              <Input
                id={`due-${action.key}`}
                type="date"
                value={due}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setDue(e.target.value)}
                className="w-44"
              />
              <Button size="sm" onClick={() => mutate.mutate({ id: 'reschedule' })} disabled={mutate.isPending}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {action.primary_action && (
              <Button size="sm" onClick={() => run(action.primary_action!)} disabled={mutate.isPending}>
                {mutate.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : action.primary_action.id === 'complete' ? (
                  <Check className="size-4" />
                ) : action.primary_action.id === 'prompt' ? (
                  <Sparkles className="size-4" />
                ) : null}
                {action.primary_action.label}
              </Button>
            )}
            {action.secondary_actions.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={s.id === 'dismiss' ? 'ghost' : 'outline'}
                onClick={() => run(s)}
                disabled={mutate.isPending}
              >
                {s.id === 'dismiss' && <X className="size-3.5" />}
                {s.id === 'snooze' ? 'Snooze 1 day' : s.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </li>
  )
}
