import { useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar } from './ui'
import { PAGES } from '../data/pages'
import { useApp } from '../lib/store'

/** ⌘K sheet: jump to a page, a contact or a campaign, or run an action. */
export default function Palette({ onClose }) {
  const { go, setSide, side, setRight, right } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const list = useRef(null)

  const items = useMemo(() => {
    const all = [
      ...PAGES.map((p) => ({ group: 'Pages', key: `p-${p.id}`, icon: p.icon, label: p.label, hint: 'Go to', run: () => go(p.id) })),
      { group: 'Actions', key: 'a-task', icon: 'task', label: 'Open tasks', hint: 'Tasks', run: () => go('tasks') },
      { group: 'Actions', key: 'a-side', icon: 'sidebarL', label: side ? 'Hide sidebar' : 'Show sidebar', hint: 'View', run: () => setSide(!side) },
      { group: 'Actions', key: 'a-right', icon: 'sidebarR', label: right ? 'Hide widgets' : 'Show widgets', hint: 'View', run: () => setRight(!right) },
    ]
    const t = q.trim().toLowerCase()
    if (!t) return all.filter((i) => i.group === 'Pages' || i.group === 'Actions')
    return all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(t)).slice(0, 14)
  }, [q, go, setSide, side, setRight, right])

  const pick = (it) => {
    it.run()
    if (!it.keep) onClose()
  }

  const key = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      setSel(n)
      list.current?.querySelector(`[data-n="${n}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && items[sel]) pick(items[sel])
    else if (e.key === 'Escape') onClose()
  }

  let last = null
  return (
    <div className="sheet-wrap" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet palette" role="dialog" aria-label="Search">
        <label className="pal-input">
          <Icon name="search" size={20} />
          <input
            autoFocus
            value={q}
            placeholder="Search CRM pages and actions…"
            onChange={(e) => {
              setQ(e.target.value)
              setSel(0)
            }}
            onKeyDown={key}
          />
          <kbd>esc</kbd>
        </label>
        <div className="pal-list" ref={list}>
          {items.length === 0 && <p className="pal-empty">No results for “{q}”</p>}
          {items.map((it, n) => {
            const head = it.group !== last
            last = it.group
            return (
              <div key={it.key}>
                {head && <h6>{it.group}</h6>}
                <button
                  type="button"
                  data-n={n}
                  className={`pal-row${n === sel ? ' on' : ''}`}
                  onPointerMove={() => n !== sel && setSel(n)}
                  onClick={() => pick(it)}
                >
                  {it.person ? <Avatar person={it.person} size={28} /> : <span className="pal-ic"><Icon name={it.icon} size={17} /></span>}
                  <span className="pal-label">{it.label}</span>
                  <span className="pal-hint">{it.hint}</span>
                  <Icon name="arrowRight" size={15} className="pal-go" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
