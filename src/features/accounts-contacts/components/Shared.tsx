import { AlertTriangle, Download, Loader2, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  downloadDocument,
  type ActivityRow,
  type DocumentRow,
  type OpportunityRow,
  type Section,
} from '@/features/accounts-contacts/api/crmApi'
import { money } from '@/features/intelligence/lib/money'
import { cn } from '@/lib/utils'

export function ListToolbar({
  search,
  onSearch,
  placeholder,
  includeInactive,
  onIncludeInactive,
  count,
  limit,
  fetching,
}: {
  search: string
  onSearch: (v: string) => void
  placeholder: string
  includeInactive: boolean
  onIncludeInactive: (v: boolean) => void
  count?: number
  limit?: number
  fetching: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[16rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-9"
          maxLength={100}
        />
        {fetching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={includeInactive} onCheckedChange={onIncludeInactive} /> Include inactive
      </label>
      {count !== undefined && (
        <span className="text-sm tabular-nums text-muted-foreground">
          {count} shown{limit && count >= limit ? ` (first ${limit} — refine your search)` : ''}
        </span>
      )}
    </div>
  )
}

export function SectionCard({
  title,
  count,
  error,
  empty,
  children,
}: {
  title: string
  count?: number
  error?: string | null
  empty?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card/85 p-5 backdrop-blur">
      <h2 className="flex items-baseline gap-2 font-semibold">
        {title}
        {count !== undefined && !error && <span className="text-xs font-normal tabular-nums text-muted-foreground">{count}</span>}
      </h2>
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Couldn't load from Dynamics 365: {error}
        </p>
      ) : count === 0 ? (
        <p className="text-sm text-muted-foreground">{empty ?? 'None.'}</p>
      ) : (
        children
      )}
    </section>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium">{children}</dd>
    </div>
  )
}

const STATUS_CLS: Record<string, string> = {
  Open: 'text-foreground',
  Won: 'text-emerald-600 dark:text-emerald-400',
  Lost: 'text-muted-foreground line-through',
}

export function OpportunityList({ section }: { section: Section<OpportunityRow> }) {
  return (
    <SectionCard title="Opportunities" count={section.items.length} error={section.error} empty="No opportunities.">
      <ul className="divide-y">
        {section.items.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <Link to={`/workspace/opportunities/${o.id}`} className="font-medium hover:underline">
                {o.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {[o.stage, o.close_date && `close ${o.close_date}`, o.owner].filter(Boolean).join(' · ')}
              </p>
            </div>
            <span className="flex items-center gap-3 text-sm tabular-nums">
              {money(o.value)}
              <span className={cn('text-xs font-semibold', STATUS_CLS[o.status])}>{o.status}</span>
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

export function ActivityList({ section }: { section: Section<ActivityRow> }) {
  return (
    <SectionCard title="Activity" count={section.items.length} error={section.error} empty="No recorded activity.">
      <ol className="space-y-2">
        {section.items.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{a.subject}</p>
              <p className="text-xs text-muted-foreground">{[a.type, a.owner].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              <span className={cn('block font-medium', a.status === 'Open' && 'text-foreground')}>{a.status}</span>
              {a.due || a.created}
            </span>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

export function DocumentList({ section, email }: { section: Section<DocumentRow>; email: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const download = async (d: DocumentRow) => {
    setBusy(d.id)
    try {
      await downloadDocument(email, d.id, d.title)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <SectionCard title="Documents & notes" count={section.items.length} error={section.error} empty="No documents.">
      <ul className="divide-y">
        {section.items.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate">{d.title}</span>
            {d.is_file ? (
              <button
                type="button"
                onClick={() => void download(d)}
                disabled={busy === d.id}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {busy === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Download
              </button>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">Note{d.created ? ` · ${d.created}` : ''}</span>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

export function DuplicateWarning({
  items,
  kind,
}: {
  items: { id: string; name: string; reasons: string[] }[]
  kind: 'accounts' | 'contacts'
}) {
  if (!items.length) return null
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div>
        <p className="font-medium">
          Possible duplicate{items.length > 1 ? 's' : ''} — review in Dynamics 365. Nothing is merged automatically.
        </p>
        <ul className="mt-1 space-y-0.5">
          {items.map((d) => (
            <li key={d.id}>
              <Link to={`/${kind}/${d.id}`} className="underline underline-offset-2">
                {d.name}
              </Link>{' '}
              <span className="text-muted-foreground">({d.reasons.join(', ')})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
