import { useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../auth'
import { PAGES } from '../data/pages'
import { useApp } from '../lib/store'
import BrandLogo from './BrandLogo'

/** The bent-back left panel of the main window: workspace and navigation. */
export default function Sidebar() {
  const { page, go } = useApp()
  const { profile, photo, signOut } = useAuth()
  const displayName = profile?.displayName || 'Workspace user'
  const email = profile?.mail || profile?.userPrincipalName || ''
  const nav = useRef(null)
  const [ind, setInd] = useState(null)

  /* slide the highlight to the active row */
  useLayoutEffect(() => {
    const place = () => {
      const btn = nav.current?.querySelector(`[data-id="${page}"]`)
      if (btn) setInd({ y: btn.offsetTop, h: btn.offsetHeight })
    }
    place()
    addEventListener('resize', place)
    return () => removeEventListener('resize', place)
  }, [page])

  const item = (p, i) => (
    <button
      type="button"
      key={p.id}
      data-id={p.id}
      className={`nav-item${p.id === page ? ' on' : ''}`}
      style={{ '--i': i }}
      aria-current={p.id === page ? 'page' : undefined}
      onClick={() => go(p.id)}
    >
      <Icon name={p.icon} size={21} />
      <span>{p.label}</span>
      {p.badge && <b className="badge">{p.badge}</b>}
    </button>
  )

  return (
    <nav className="win side" aria-label="Main">
      <div className="sidebar-brand">
        <BrandLogo className="sidebar-logo" />
      </div>

      <div className="nav" ref={nav}>
        {ind && <i className="nav-ind" style={{ transform: `translateY(${ind.y}px)`, height: ind.h }} />}
        <div className="nav-group">{PAGES.filter((p) => !p.low).map(item)}</div>
        <div className="nav-group low">{PAGES.filter((p) => p.low).map((p, i) => item(p, i + 10))}</div>
      </div>
      <div className="sidebar-account">
        {photo ? <img src={photo} alt="" /> : <span className="sidebar-initial">{displayName.slice(0,1).toUpperCase()}</span>}
        <div className="sidebar-user">
          <b>{displayName}</b>
          <small>{email}</small>
        </div>
        <button type="button" onClick={signOut} title="Sign out">Sign out</button>
      </div>
    </nav>
  )
}
