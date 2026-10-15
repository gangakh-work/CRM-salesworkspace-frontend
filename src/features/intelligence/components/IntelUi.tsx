import { AlertCircle, ChevronDown, Inbox, Loader2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { Evidence } from '@/features/intelligence/api/intelApi'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between border-b border-foreground/80 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
        <span>{eyebrow}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[0.92] tracking-[-0.04em]">{title}</h1>
          {subtitle && <p className="max-w-2xl text-base text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

const SEVERITY = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
  info: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
} as const

export function Severity({ level, children }: { level: keyof typeof SEVERITY; children?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', SEVERITY[level])}>
      {children ?? (level === 'ok' ? 'On track' : level)}
    </span>
  )
}

export function Why({ evidence, source, extra }: { evidence: Evidence[]; source: string; extra?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:underline"
      >
        Why? <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 space-y-1 rounded-lg bg-muted/40 px-3 py-2 text-xs">
          {extra}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {evidence.map((e, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-foreground">{e.field}</dt>
                <dd className="font-medium tabular-nums">{String(e.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="pt-1 text-muted-foreground">Source: {source}</p>
        </div>
      )}
    </div>
  )
}

export function LoadState({
  isLoading,
  error,
  onRetry,
  empty,
  emptyText,
  children,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
  empty?: boolean
  emptyText?: string
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground" aria-busy="true">
        <Loader2 className="size-4 animate-spin" /> Loading from Dynamics 365…
      </div>
    )
  }
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="size-4 text-destructive" />
        <span className="flex-1">{(error as Error).message}</span>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }
  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <Inbox className="mx-auto mb-3 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    )
  }
  return <>{children}</>
}
