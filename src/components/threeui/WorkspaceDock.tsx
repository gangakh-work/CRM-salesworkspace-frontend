import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { createTopDockController, type TopDockOptions } from '@/vendor/threeui/topDockController'

/**
 * ThreeUI AnimatedTopDock — Sable variant — as the CRM's primary dock.
 *
 * Motion, spring physics and styling are the authored ThreeUI source:
 *  - `createTopDockController` is vendored byte-for-byte (see vendor/threeui),
 *  - the markup uses the authored Sable classes, styled by
 *    `@designcodeio/threeui/style.css`,
 *  - options are the configured usage (proximity 122, spring .19, damping .70,
 *    widthGrowth 17, heightGrowth 16, drop 3.5).
 * Only the items differ: the authored demo labels (SYSTEM / METHOD / WORK /
 * ACCESS / NOTES) are replaced by real CRM destinations that navigate.
 */

const DOCK_OPTIONS: TopDockOptions = {
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
  axis: 'x',
  distribute: false,
  lockTrack: false,
}

type DockItem = { id: string; label: string; path: string; match: (pathname: string) => boolean; icon: ReactNode }

/* 16×16 stroke icons in the Sable icon style (several are the authored ones) */
const ITEMS: readonly DockItem[] = [
  {
    id: 'home',
    label: 'HOME',
    path: '/dashboard',
    match: (p) => p === '/dashboard' || p === '/',
    icon: (
      <>
        <rect x="2.25" y="2.25" width="4.5" height="4.5" rx=".8" />
        <rect x="9.25" y="2.25" width="4.5" height="4.5" rx=".8" />
        <rect x="2.25" y="9.25" width="4.5" height="4.5" rx=".8" />
        <rect x="9.25" y="9.25" width="4.5" height="4.5" rx=".8" />
      </>
    ),
  },
  {
    id: 'leads',
    label: 'LEADS',
    path: '/workspace/leads',
    match: (p) => p.startsWith('/workspace/leads'),
    icon: (
      <>
        <circle cx="8" cy="5.4" r="2.6" />
        <path d="M3 13.6c.8-2.7 2.8-4.1 5-4.1s4.2 1.4 5 4.1" />
      </>
    ),
  },
  {
    id: 'pipeline',
    label: 'PIPELINE',
    path: '/workspace/opportunities',
    match: (p) => p.startsWith('/workspace/opportunities'),
    icon: (
      <>
        <circle cx="3" cy="8" r="1.5" />
        <circle cx="12.5" cy="3.5" r="1.5" />
        <circle cx="12.5" cy="12.5" r="1.5" />
        <path d="M4.5 7.3 11 4.2M4.5 8.7l6.5 3.1" />
      </>
    ),
  },
  {
    id: 'activity',
    label: 'ACTIVITY',
    path: '/workspace/activities',
    match: (p) => p.startsWith('/workspace/activities') || p.startsWith('/workspace/tasks'),
    icon: (
      <>
        <circle cx="8" cy="8" r="5.9" />
        <path d="M8 4.6V8l2.4 1.5" />
      </>
    ),
  },
  {
    id: 'agent',
    label: 'AGENT',
    path: '/sales-agent',
    match: (p) => p.startsWith('/sales-agent'),
    icon: (
      <>
        <path d="M8 1.9v2.2M8 11.9v2.2M1.9 8h2.2M11.9 8h2.2" />
        <path d="M8 4.6 9.1 6.9 11.4 8 9.1 9.1 8 11.4 6.9 9.1 4.6 8 6.9 6.9z" />
      </>
    ),
  },
]

export function WorkspaceDock({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const rootRef = useRef<HTMLElement>(null)

  /* same lifecycle as the authored component: one controller per mount */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    return createTopDockController(root, () => DOCK_OPTIONS)
  }, [])

  return (
    <div className={`workspace-dock ${className}`}>
      <nav
        ref={rootRef}
        className="animated-top-dock__nav"
        aria-label="Primary"
        data-dock-state="idle"
        data-dock-max="0.00"
      >
        <button
          className="animated-top-dock__item animated-top-dock__logo"
          data-dock-item
          type="button"
          aria-label="Home"
          onClick={() => navigate('/dashboard')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect width="24" height="24" rx="4.5" fill="#E8E8E3" />
            <text
              x="12"
              y="15.6"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              fill="#111"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              SW
            </text>
          </svg>
        </button>
        {ITEMS.map((item) => {
          const active = item.match(pathname)
          return (
            <button
              key={item.id}
              className="animated-top-dock__item animated-top-dock__link"
              data-dock-item
              type="button"
              aria-pressed={active}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(item.path)}
            >
              <span className="animated-top-dock__icon" aria-hidden="true">
                <svg viewBox="0 0 16 16">{item.icon}</svg>
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
