import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Reveal } from '@/components/patterns/Reveal'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

export interface RecordCardData {
  id: string
  kind: 'lead' | 'opportunity'
  title: string
  subtitle?: string
  badge?: string
  badge_tone?: 'error' | 'warning' | 'success' | 'info' | 'neutral'
  meta?: { icon: 'value' | 'date' | 'company' | 'owner'; value: string }[]
  seed: string
  monogram?: string
  href?: string | null
  status?: string
}

export interface RecordCardAction {
  label: string
  onClick: (card: RecordCardData) => void
}

/** Status is typography, not colour — a filled dot only for things that need action. */
function Status({ card, compact = false }: { card: RecordCardData; compact?: boolean }) {
  if (!card.badge) return null
  const urgent = card.badge_tone === 'error' || card.badge_tone === 'warning'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap font-semibold uppercase',
        compact ? 'text-[9px] tracking-[0.08em]' : 'text-[10px] tracking-[0.18em]',
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', urgent ? 'bg-current' : 'border border-current')}
      />
      {card.badge}
    </span>
  )
}

function valueOf(card: RecordCardData, icon: 'value' | 'date' | 'company' | 'owner') {
  return card.meta?.find((m) => m.icon === icon)?.value
}

/* ── Card ──────────────────────────────────────────────────────────────── */

export function RecordCard({
  card,
  index = 0,
  onOpen,
  primaryAction,
  compact = false,
}: {
  card: RecordCardData
  index?: number
  onOpen?: (card: RecordCardData) => void
  primaryAction?: RecordCardAction
  compact?: boolean
}) {
  const value = valueOf(card, 'value')
  const date = valueOf(card, 'date')
  const secondary = valueOf(card, 'company') ?? valueOf(card, 'owner')

  return (
    <article
      className={cn(
        'group relative border-t border-foreground transition-colors duration-500 ease-out',
        'hover:bg-foreground hover:text-background focus-within:bg-foreground focus-within:text-background',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen?.(card)}
        className={cn(
          'flex w-full flex-col text-left focus-visible:outline-none',
          compact ? 'gap-3 px-3 pb-4 pt-3' : 'gap-5 px-4 pb-6 pt-4',
        )}
        aria-label={`Open ${card.title}`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] tabular-nums opacity-60">{String(index + 1).padStart(2, '0')}</span>
          {/* Status gives way to the hover arrow */}
          <span className="transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0">
            <Status card={card} compact={compact} />
          </span>
        </span>

        <span
          className={cn(
            'line-clamp-2 font-bold leading-[1.05] tracking-tight',
            compact ? 'text-lg' : 'text-2xl xl:text-[1.75rem]',
          )}
        >
          {card.title}
        </span>

        {(card.subtitle || secondary) && (
          <span className="truncate text-[11px] uppercase tracking-[0.16em] opacity-60">
            {card.subtitle || secondary}
          </span>
        )}

        {(value || date) && (
          <span className="flex items-end justify-between gap-3">
            <span className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-base' : 'text-xl')}>
              {value ?? ''}
            </span>
            {date && (
              <span
                className={cn(
                  'text-xs tabular-nums opacity-60 transition-opacity duration-300',
                  primaryAction && 'group-hover:opacity-0 group-focus-within:opacity-0',
                )}
              >
                {date}
              </span>
            )}
          </span>
        )}
      </button>

      {/* Arrow + contextual CTA appear on hover / focus */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-4 opacity-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
      >
        <ArrowUpRight className="size-4" />
      </span>
      {primaryAction && (
        <button
          type="button"
          onClick={() => primaryAction.onClick(card)}
          className={cn(
            'absolute text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4',
            compact ? 'bottom-4 right-3' : 'bottom-6 right-4',
            'opacity-0 transition-opacity duration-500 hover:underline focus-visible:underline focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100',
          )}
        >
          {primaryAction.label} →
        </button>
      )}
    </article>
  )
}

/* ── Parallax column (welcome page gallery) ────────────────────────────── */

function ParallaxColumn({ speed, offset, children }: { speed: number; offset: boolean; children: ReactNode }) {
  const ref = useParallax<HTMLDivElement>(speed)
  return (
    <div ref={ref} className={cn('flex flex-col gap-10 will-change-transform', offset && 'pt-20')}>
      {children}
    </div>
  )
}

const COLUMN_SPEEDS = [0, 0.06, 0.025, 0.05]

/* ── Gallery ───────────────────────────────────────────────────────────── */

export function RecordGallery({
  cards,
  title,
  eyebrow,
  onOpen,
  primaryAction,
  compact = false,
  filters = true,
  parallax = false,
  emptyText = 'Nothing to show.',
  headerExtra,
  initialLimit,
}: {
  cards: RecordCardData[]
  title?: string
  /** Small editorial label above the title, e.g. "03". */
  eyebrow?: string
  onOpen?: (card: RecordCardData) => void
  primaryAction?: (card: RecordCardData) => RecordCardAction | undefined
  /** Dense variant for chat bubbles. */
  compact?: boolean
  filters?: boolean
  /** Columns drift at different speeds while scrolling. */
  parallax?: boolean
  emptyText?: string
  headerExtra?: ReactNode
  /** Show this many first, then "Show all". */
  initialLimit?: number
}) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(3)

  const tabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of cards) if (c.badge) counts.set(c.badge, (counts.get(c.badge) ?? 0) + 1)
    return [...counts.entries()]
  }, [cards])

  const filtered = filter === 'all' ? cards : cards.filter((c) => c.badge === filter)
  const limited = Boolean(initialLimit && !expanded && filtered.length > initialLimit)
  const visible = limited ? filtered.slice(0, initialLimit) : filtered
  const minWidth = compact ? 150 : 260

  // Column count follows the container width (works in docked panels too).
  useEffect(() => {
    const el = gridRef.current
    if (!el || !parallax) return
    const ro = new ResizeObserver(([entry]) => {
      setColumns(Math.max(1, Math.min(4, Math.floor(entry.contentRect.width / minWidth))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [parallax, minWidth])

  const split = useMemo(() => {
    const cols: { card: RecordCardData; index: number }[][] = Array.from({ length: columns }, () => [])
    visible.forEach((card, index) => cols[index % columns].push({ card, index }))
    return cols
  }, [visible, columns])

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {(title || !compact) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            {eyebrow && <p className="font-mono text-[11px] text-muted-foreground">{eyebrow}</p>}
            <div className="flex items-baseline gap-3">
              {title && (
                <h2 className={cn('font-bold tracking-tight', compact ? 'text-base' : 'text-3xl md:text-4xl')}>{title}</h2>
              )}
              <span className="font-mono text-xs tabular-nums text-muted-foreground">({cards.length})</span>
              {headerExtra}
            </div>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      )}
      {!title && compact && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">({cards.length})</span>
          <ViewToggle view={view} onChange={setView} />
        </div>
      )}

      {filters && tabs.length > 1 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label="Filter">
          {[['all', cards.length] as const, ...tabs].map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-[6px] transition-opacity focus-visible:outline-none focus-visible:underline',
                filter === key ? 'underline decoration-2' : 'opacity-50 hover:opacity-100',
              )}
            >
              {key === 'all' ? 'All' : key} <span className="font-mono tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="border-t border-foreground/20 py-10 text-sm text-muted-foreground">{emptyText}</p>
      ) : view === 'list' ? (
        <ul className="border-b border-foreground/15">
          {visible.map((card, i) => (
            <li key={card.id || i} className="border-t border-foreground/15">
              <button
                type="button"
                onClick={() => onOpen?.(card)}
                className="group grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-2 py-3 text-left transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none"
              >
                <span className="font-mono text-[11px] tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{card.title}</span>
                  {card.subtitle && (
                    <span className="block truncate text-[10px] uppercase tracking-[0.16em] opacity-60">{card.subtitle}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <Status card={card} />
                  <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : parallax && !compact ? (
        <div ref={gridRef} className="grid items-start gap-x-6 pb-12 pt-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {split.map((col, c) => (
            <ParallaxColumn key={c} speed={COLUMN_SPEEDS[c] ?? 0} offset={c % 2 === 1}>
              {col.map(({ card, index }) => (
                <Reveal key={card.id || index} delay={(index % columns) * 0.06}>
                  <RecordCard card={card} index={index} onOpen={onOpen} primaryAction={primaryAction?.(card)} />
                </Reveal>
              ))}
            </ParallaxColumn>
          ))}
        </div>
      ) : (
        <div
          ref={gridRef}
          className={cn('grid', compact ? 'gap-x-3 gap-y-4' : 'gap-x-6 gap-y-8')}
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}
        >
          {visible.map((card, i) => (
            <RecordCard
              key={card.id || i}
              card={card}
              index={i}
              compact={compact}
              onOpen={onOpen}
              primaryAction={primaryAction?.(card)}
            />
          ))}
        </div>
      )}

      {(limited || (expanded && initialLimit && filtered.length > initialLimit)) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] hover:opacity-70 focus-visible:outline-none"
        >
          {expanded ? 'Show fewer' : `Show all ${filtered.length}`}
        </button>
      )}
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label="View">
      {(['grid', 'list'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-[6px] focus-visible:outline-none focus-visible:underline',
            view === v ? 'underline decoration-2' : 'opacity-50 hover:opacity-100',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
