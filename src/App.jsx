import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './lib/store'
import Environment from './components/Environment'
import Sidebar from './components/Sidebar'
import { PAGES } from './data/pages'
import Grabber from './components/Grabber'
import Palette from './components/Palette'
import Toasts from './components/Toasts'
import CRMWidgets from './widgets/CRMWidgets'
const Overview = lazy(() => import('./pages/Overview'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Leads = lazy(() => import('./pages/Leads'))
const Opportunities = lazy(() => import('./pages/Opportunities'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Companies = lazy(() => import('./pages/Companies'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Integrations = lazy(() => import('./pages/Integrations'))
const Support = lazy(() => import('./pages/Support'))
const LeadDetail = lazy(() => import('./pages/LeadDetail'))
const OpportunityDetail = lazy(() => import('./pages/OpportunityDetail'))
const ConversationInsights = lazy(() => import('./pages/ConversationInsights'))

const VIEWS = {
  overview: Overview,
  inbox: Inbox,
  leads: Leads,
  opportunities: Opportunities,
  assistant: Assistant,
  contacts: Contacts,
  companies: Companies,
  tasks: Tasks,
  calendar: Calendar,
  reports: ConversationInsights,
  'conversation-insights': ConversationInsights,
  integrations: Integrations,
  support: Support,
  'lead-detail': LeadDetail,
  'opportunity-detail': OpportunityDetail,
}

/* the scene is drawn on a fixed 1780×910 canvas and zoomed to fit the window */
const CANVAS = { w: 1780, h: 910 }
const SPATIAL_MIN = 1100

const DEFAULTS = {
  curve: 16,
  depth: 1700,
  frost: 34,
  tint: 30,
  parallax: true,
  motion: true,
}

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('myflow-space') || '{}') }
  } catch {
    return DEFAULTS
  }
}

const pageFromHash = () => {
  const id = location.hash.replace(/^#\/?/, '')
  return VIEWS[id] ? id : 'overview'
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [page, setPage] = useState(pageFromHash)
  const [side, setSide] = useState(true)
  const [right, setRight] = useState(true)
  const [sheet, setSheet] = useState(null) // 'palette' | 'topup' | null
  const [toasts, setToasts] = useState([])
  const [booting, setBooting] = useState(true)
  const [recordDetail, setRecordDetail] = useState(null)
  const [spatial, setSpatial] = useState(() => innerWidth >= SPATIAL_MIN)
  const stage = useRef(null)

  const set = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])

  /* persist + mirror the settings onto <html> so plain CSS can read them */
  useEffect(() => {
    localStorage.setItem('myflow-space', JSON.stringify(settings))
    const root = document.documentElement
    root.dataset.motion = settings.motion ? 'on' : 'off'
    root.style.setProperty('--curve', `${settings.curve}deg`)
    root.style.setProperty('--depth', `${settings.depth}px`)
    root.style.setProperty('--frost', `${settings.frost}px`)
    root.style.setProperty('--tint', settings.tint / 100)
  }, [settings])

  /* a new page always starts at its top */
  const toTop = () => {
    stage.current?.querySelector('.page-scroll')?.scrollTo(0, 0)
    if (innerWidth < SPATIAL_MIN) scrollTo(0, 0)
  }

  /* each page is a #/hash entry, so the browser's own back and forward buttons work */
  const go = useCallback((id) => {
    if (id === pageFromHash()) return
    history.pushState(null, '', id === 'overview' ? location.pathname : `#/${id}`)
    toTop()
    setPage(id)
  }, [])
  useEffect(() => {
    const pop = () => {
      toTop()
      setPage(pageFromHash())
    }
    addEventListener('popstate', pop)
    return () => removeEventListener('popstate', pop)
  }, [])

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((all) => [...all.slice(-2), { id, ...t }])
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 3200)
  }, [])

  /* fit the canvas to the viewport; below SPATIAL_MIN the windows lie flat and scroll */
  useEffect(() => {
    const fit = () => {
      const wide = innerWidth >= SPATIAL_MIN
      setSpatial(wide)
      const z = wide ? Math.min(1.45, Math.max(0.55, Math.min(innerWidth / CANVAS.w, innerHeight / CANVAS.h))) : 1
      document.documentElement.style.setProperty('--z', z.toFixed(4))
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])

  /* head-tracking: the pointer moves the vantage point. Windows near z=0 stay put,
     the bent edges swing against them and the far-off photo drifts the other way.
     Styles are written straight onto the two elements involved — a custom property
     on the stage would restyle every node in the app on every frame. */
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const paint = (x, y) => {
      const space = el.querySelector('.space')
      const env = el.querySelector('.env')
      if (space) space.style.perspectiveOrigin = `${50 + x * 10}% ${42 + y * 8}%`
      if (env) env.style.translate = `${x * 16}px ${y * 10}px`
    }
    if (!settings.parallax || !settings.motion || !spatial) {
      paint(0, 0)
      return
    }
    const target = { x: 0, y: 0 }
    const now = { x: 0, y: 0 }
    let raf = 0
    const step = () => {
      now.x += (target.x - now.x) * 0.06
      now.y += (target.y - now.y) * 0.06
      paint(now.x, now.y)
      raf = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001 ? requestAnimationFrame(step) : 0
    }
    const move = (e) => {
      target.x = (e.clientX / innerWidth) * 2 - 1
      target.y = (e.clientY / innerHeight) * 2 - 1
      if (!raf) raf = requestAnimationFrame(step)
    }
    const leave = () => {
      target.x = 0
      target.y = 0
      if (!raf) raf = requestAnimationFrame(step)
    }
    addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [settings.parallax, settings.motion, spatial])

  /* gaze highlight: whichever .hl surface is under the pointer gets a soft light at that spot */
  useEffect(() => {
    let last = null
    const move = (e) => {
      const el = e.target.closest?.('.hl')
      if (last && last !== el) last.classList.remove('lit')
      last = el
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      el.classList.add('lit')
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])

  /* ⌘K / Ctrl-K opens search */
  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSheet((s) => (s === 'palette' ? null : 'palette'))
      }
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [])

  /* the long entrance only plays on first load */
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2000)
    return () => clearTimeout(t)
  }, [])

  const ctx = useMemo(
    () => ({ page, go, settings, set, toast, openSheet: setSheet, spatial, side, setSide, right, setRight, recordDetail, setRecordDetail }),
    [page, go, settings, set, toast, spatial, side, right, recordDetail],
  )

  const View = VIEWS[page]
  const label = PAGES.find((p) => p.id === page)?.label

  return (
    <AppContext.Provider value={ctx}>
      <main
        ref={stage}
        className={`stage${sheet ? ' sheet-open' : ''}`}
        data-layout={spatial ? 'spatial' : 'flat'}
      >
        <Environment />
        <div className={`space${side ? '' : ' no-side'}${page === 'assistant' || !right ? ' no-right' : ''}${booting ? ' booting' : ''}`}>
          <Sidebar />

          <section className="win main" aria-label={label}>
            <div className="page-scroll">
              <div className="page" key={page} data-page={page}>
                <Suspense fallback={<div className="card hl" role="status" aria-live="polite" style={{ minHeight: 180, display: 'grid', placeItems: 'center' }}>Loading page…</div>}>
                  <View />
                </Suspense>
              </div>
            </div>
          </section>

          {page !== 'assistant' && <aside className="facet right" aria-label="Sales insights"><CRMWidgets /></aside>}

          <Grabber />
        </div>

        {sheet === 'palette' && <Palette onClose={() => setSheet(null)} />}
        <Toasts items={toasts} />
      </main>
    </AppContext.Provider>
  )
}
